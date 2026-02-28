// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PassItOn - A viral "hot potato" NFT game on Base L2
/// @notice Players must pass the NFT to another wallet within 24 hours or it burns
/// @dev ERC-721 with built-in timer, leaderboard tracking, and burn-on-expiry logic
contract PassItOn is ERC721, Ownable, ReentrancyGuard {
    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────
    uint256 public constant PASS_DEADLINE = 24 hours;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    uint256 private _nextTokenId;

    struct NFTData {
        uint64 deadline;       // unix timestamp when the NFT expires
        uint32 passCount;      // how many times this NFT has been passed
        uint32 chainLength;    // current unbroken chain length
        bool alive;            // false once burned / lost
    }

    mapping(uint256 => NFTData) public nfts;

    // Track unique holders per token for "most participants" stat
    mapping(uint256 => uint32) public uniqueHolderCount;
    mapping(uint256 => mapping(address => bool)) private _hasHeld;

    // ──────────────────────────────────────────────
    //  Leaderboard tracking (top values across all tokens)
    // ──────────────────────────────────────────────
    uint256 public longestChainTokenId;
    uint32 public longestChainLength;

    uint256 public mostPassesTokenId;
    uint32 public mostPassesCount;

    uint256 public mostParticipantsTokenId;
    uint32 public mostParticipantsCount;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event NFTMinted(uint256 indexed tokenId, address indexed to, uint64 deadline);
    event NFTPassed(uint256 indexed tokenId, address indexed from, address indexed to, uint32 passCount, uint32 chainLength, uint64 newDeadline);
    event NFTLost(uint256 indexed tokenId, address indexed lastHolder, uint32 finalPassCount, uint32 finalChainLength);
    event TimerReset(uint256 indexed tokenId, uint64 newDeadline);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────
    constructor() ERC721("PassItOn", "PASS") Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    //  Core functions
    // ──────────────────────────────────────────────

    /// @notice Mint a brand-new hot-potato NFT and send it to `to`
    /// @param to The address that receives the freshly minted NFT
    /// @return tokenId The ID of the newly minted token
    function mintNFT(address to) external nonReentrant returns (uint256 tokenId) {
        require(to != address(0), "Cannot mint to zero address");

        tokenId = _nextTokenId++;
        uint64 deadline = uint64(block.timestamp + PASS_DEADLINE);

        _safeMint(to, tokenId);

        nfts[tokenId] = NFTData({
            deadline: deadline,
            passCount: 0,
            chainLength: 1,
            alive: true
        });

        // Track first holder
        _hasHeld[tokenId][to] = true;
        uniqueHolderCount[tokenId] = 1;

        emit NFTMinted(tokenId, to, deadline);
        emit TimerReset(tokenId, deadline);
    }

    /// @notice Pass the NFT to another wallet — resets the 24h timer
    /// @dev Caller must be current owner. Cannot pass to self or zero address.
    /// @param to Recipient wallet address
    /// @param tokenId The NFT to pass
    function passNFT(address to, uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(to != address(0), "Cannot pass to zero address");
        require(to != msg.sender, "Cannot pass to yourself");

        NFTData storage data = nfts[tokenId];
        require(data.alive, "NFT is no longer alive");
        require(block.timestamp <= data.deadline, "Timer expired — NFT is lost");

        // Update stats before transfer
        uint64 newDeadline = uint64(block.timestamp + PASS_DEADLINE);
        data.deadline = newDeadline;
        data.passCount += 1;
        data.chainLength += 1;

        // Track unique holders
        if (!_hasHeld[tokenId][to]) {
            _hasHeld[tokenId][to] = true;
            uniqueHolderCount[tokenId] += 1;
        }

        // Update global leaderboard records
        if (data.chainLength > longestChainLength) {
            longestChainLength = data.chainLength;
            longestChainTokenId = tokenId;
        }
        if (data.passCount > mostPassesCount) {
            mostPassesCount = data.passCount;
            mostPassesTokenId = tokenId;
        }
        if (uniqueHolderCount[tokenId] > mostParticipantsCount) {
            mostParticipantsCount = uniqueHolderCount[tokenId];
            mostParticipantsTokenId = tokenId;
        }

        // Execute transfer (uses ERC721 internal transfer)
        _transfer(msg.sender, to, tokenId);

        emit NFTPassed(tokenId, msg.sender, to, data.passCount, data.chainLength, newDeadline);
        emit TimerReset(tokenId, newDeadline);
    }

    /// @notice Anyone can call this to burn an expired NFT and mark it "lost"
    /// @param tokenId The token to check and potentially burn
    function claimLost(uint256 tokenId) external {
        NFTData storage data = nfts[tokenId];
        require(data.alive, "Already lost");
        require(block.timestamp > data.deadline, "Timer has not expired");

        address lastHolder = ownerOf(tokenId);
        data.alive = false;

        // Burn the token
        _burn(tokenId);

        emit NFTLost(tokenId, lastHolder, data.passCount, data.chainLength);
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /// @notice Get full status of an NFT
    /// @param tokenId The token to query
    /// @return owner Current owner (zero if burned)
    /// @return deadline Expiry timestamp
    /// @return passCount Total passes
    /// @return chainLength Current chain length
    /// @return alive Whether the NFT is still active
    /// @return timeRemaining Seconds left before expiry (0 if expired)
    function getNFTStatus(uint256 tokenId)
        external
        view
        returns (
            address owner,
            uint64 deadline,
            uint32 passCount,
            uint32 chainLength,
            bool alive,
            uint256 timeRemaining
        )
    {
        NFTData memory data = nfts[tokenId];

        // If alive, try to get owner; if burned, owner is zero
        if (data.alive) {
            owner = ownerOf(tokenId);
        }

        deadline = data.deadline;
        passCount = data.passCount;
        chainLength = data.chainLength;
        alive = data.alive && block.timestamp <= data.deadline;
        timeRemaining = block.timestamp < data.deadline
            ? data.deadline - block.timestamp
            : 0;
    }

    /// @notice Returns global leaderboard data
    /// @return _longestChainTokenId Token with longest chain
    /// @return _longestChainLength Length of that chain
    /// @return _mostPassesTokenId Token with most passes
    /// @return _mostPassesCount Number of passes
    /// @return _mostParticipantsTokenId Token with most unique holders
    /// @return _mostParticipantsCount Number of unique holders
    function getLeaderboard()
        external
        view
        returns (
            uint256 _longestChainTokenId,
            uint32 _longestChainLength,
            uint256 _mostPassesTokenId,
            uint32 _mostPassesCount,
            uint256 _mostParticipantsTokenId,
            uint32 _mostParticipantsCount
        )
    {
        return (
            longestChainTokenId,
            longestChainLength,
            mostPassesTokenId,
            mostPassesCount,
            mostParticipantsTokenId,
            mostParticipantsCount
        );
    }

    /// @notice Total number of NFTs ever minted
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ──────────────────────────────────────────────
    //  Override: block standard transferFrom / safeTransferFrom
    //  Forces users to go through passNFT() so stats are tracked
    // ──────────────────────────────────────────────

    /// @dev Override to prevent direct transfers — must use passNFT()
    function transferFrom(address from, address to, uint256 tokenId) public override {
        // Allow internal _transfer calls (from passNFT) and _burn calls
        // but block external direct transfers
        require(
            msg.sender == address(this),
            "Use passNFT() to transfer"
        );
        super.transferFrom(from, to, tokenId);
    }
}
