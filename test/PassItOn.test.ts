/**
 * Tests for the PassItOn smart contract.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PassItOn", function () {
  async function deployFixture() {
    const [owner, alice, bob, charlie] = await ethers.getSigners();
    const PassItOn = await ethers.getContractFactory("PassItOn");
    const contract = await PassItOn.deploy();
    return { contract, owner, alice, bob, charlie };
  }

  describe("Minting", function () {
    it("should mint an NFT to a given address", async function () {
      const { contract, alice } = await deployFixture();

      const tx = await contract.mintNFT(alice.address);
      await tx.wait();

      expect(await contract.ownerOf(0)).to.equal(alice.address);
      expect(await contract.totalMinted()).to.equal(1);
    });

    it("should set correct initial data", async function () {
      const { contract, alice } = await deployFixture();
      await contract.mintNFT(alice.address);

      const [owner, deadline, passCount, chainLength, alive, timeRemaining] =
        await contract.getNFTStatus(0);

      expect(owner).to.equal(alice.address);
      expect(passCount).to.equal(0);
      expect(chainLength).to.equal(1);
      expect(alive).to.be.true;
      expect(timeRemaining).to.be.greaterThan(0);
    });

    it("should emit NFTMinted event", async function () {
      const { contract, alice } = await deployFixture();
      await expect(contract.mintNFT(alice.address))
        .to.emit(contract, "NFTMinted")
        .withArgs(0, alice.address, (v: any) => v > 0);
    });

    it("should reject minting to zero address", async function () {
      const { contract } = await deployFixture();
      await expect(
        contract.mintNFT(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
  });

  describe("Passing", function () {
    it("should pass NFT to another address", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      await contract.connect(alice).passNFT(bob.address, 0);
      expect(await contract.ownerOf(0)).to.equal(bob.address);
    });

    it("should increment pass count and chain length", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);
      await contract.connect(alice).passNFT(bob.address, 0);

      const [, , passCount, chainLength] = await contract.getNFTStatus(0);
      expect(passCount).to.equal(1);
      expect(chainLength).to.equal(2);
    });

    it("should reset the timer on pass", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      // Advance 12 hours
      await time.increase(12 * 3600);

      await contract.connect(alice).passNFT(bob.address, 0);

      const [, , , , , timeRemaining] = await contract.getNFTStatus(0);
      // Should be close to 24 hours again
      expect(timeRemaining).to.be.greaterThan(23 * 3600);
    });

    it("should emit NFTPassed event", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      await expect(contract.connect(alice).passNFT(bob.address, 0))
        .to.emit(contract, "NFTPassed");
    });

    it("should reject passing to self", async function () {
      const { contract, alice } = await deployFixture();
      await contract.mintNFT(alice.address);

      await expect(
        contract.connect(alice).passNFT(alice.address, 0)
      ).to.be.revertedWith("Cannot pass to yourself");
    });

    it("should reject passing by non-owner", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      await expect(
        contract.connect(bob).passNFT(alice.address, 0)
      ).to.be.revertedWith("Not the owner");
    });

    it("should update leaderboard on pass", async function () {
      const { contract, alice, bob, charlie } = await deployFixture();
      await contract.mintNFT(alice.address);
      await contract.connect(alice).passNFT(bob.address, 0);
      await contract.connect(bob).passNFT(charlie.address, 0);

      const [
        longestChainTokenId,
        longestChainLength,
        mostPassesTokenId,
        mostPassesCount,
      ] = await contract.getLeaderboard();

      expect(longestChainTokenId).to.equal(0);
      expect(longestChainLength).to.equal(3);
      expect(mostPassesTokenId).to.equal(0);
      expect(mostPassesCount).to.equal(2);
    });
  });

  describe("Timer expiry", function () {
    it("should reject passing after timer expires", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      // Advance past 24 hours
      await time.increase(25 * 3600);

      await expect(
        contract.connect(alice).passNFT(bob.address, 0)
      ).to.be.revertedWith("Timer expired - NFT is lost");
    });

    it("should allow claiming lost NFT after expiry", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      await time.increase(25 * 3600);

      await expect(contract.connect(bob).claimLost(0))
        .to.emit(contract, "NFTLost")
        .withArgs(0, alice.address, 0, 1);
    });

    it("should reject claiming before expiry", async function () {
      const { contract, alice } = await deployFixture();
      await contract.mintNFT(alice.address);

      await expect(contract.claimLost(0)).to.be.revertedWith(
        "Timer has not expired"
      );
    });

    it("should report alive=false after expiry", async function () {
      const { contract, alice } = await deployFixture();
      await contract.mintNFT(alice.address);

      await time.increase(25 * 3600);

      const [, , , , alive, timeRemaining] = await contract.getNFTStatus(0);
      expect(alive).to.be.false;
      expect(timeRemaining).to.equal(0);
    });
  });

  describe("Transfer restrictions", function () {
    it("should block direct transferFrom", async function () {
      const { contract, alice, bob } = await deployFixture();
      await contract.mintNFT(alice.address);

      await expect(
        contract.connect(alice).transferFrom(alice.address, bob.address, 0)
      ).to.be.revertedWith("Use passNFT() to transfer");
    });
  });
});
