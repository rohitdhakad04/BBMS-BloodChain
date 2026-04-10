const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BloodDonation", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const BloodDonation = await ethers.getContractFactory("BloodDonation");
    contract = await BloodDonation.deploy();
    await contract.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    const address = await contract.getAddress();
    expect(address).to.be.properAddress;
  });

  it("Should add a donation", async function () {
    await contract.addDonation("John Doe", "A+", "2024-01-01T10:00", "New York", "City Hospital");
    const count = await contract.getDonationCount();
    expect(count).to.equal(1);
  });

  it("Should return all donations", async function () {
    await contract.addDonation("John Doe", "A+", "2024-01-01T10:00", "New York", "City Hospital");
    await contract.addDonation("Jane Doe", "B+", "2024-01-02T10:00", "Boston", "General Hospital");
    const donations = await contract.getAllDonations();
    expect(donations.length).to.equal(2);
  });

  it("Should filter by blood group", async function () {
    await contract.addDonation("John Doe", "A+", "2024-01-01T10:00", "New York", "City Hospital");
    await contract.addDonation("Jane Doe", "B+", "2024-01-02T10:00", "Boston", "General Hospital");
    const results = await contract.getDonationsByBloodGroup("A+");
    expect(results.length).to.equal(1);
    expect(results[0].bloodGroup).to.equal("A+");
  });

  it("Should generate unique hash", async function () {
    await contract.addDonation("John Doe", "A+", "2024-01-01T10:00", "New York", "City Hospital");
    await contract.addDonation("Jane Doe", "B+", "2024-01-02T10:00", "Boston", "General Hospital");
    const donations = await contract.getAllDonations();
    expect(donations[0].blockHash).to.not.equal(donations[1].blockHash);
  });

  it("Should reject empty fields", async function () {
    await expect(
      contract.addDonation("", "A+", "2024-01-01T10:00", "New York", "City Hospital")
    ).to.be.revertedWith("Donor name required");
  });
});
