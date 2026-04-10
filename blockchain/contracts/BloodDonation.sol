// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BloodDonation {
    struct Donation {
        uint256 id;
        string donorName;
        string bloodGroup;
        string dateTime;
        string location;
        string hospitalName;
        address donatedBy;
        uint256 timestamp;
        bytes32 blockHash;
    }

    Donation[] public donations;
    uint256 public donationCount;
    mapping(address => uint256[]) public donorHistory;
    address public admin;

    event DonationAdded(uint256 indexed id, string bloodGroup, address indexed donor, bytes32 blockHash);

    constructor() {
        admin = msg.sender;
    }

    function addDonation(
        string memory donorName,
        string memory bloodGroup,
        string memory dateTime,
        string memory location,
        string memory hospitalName
    ) public {
        require(bytes(donorName).length > 0, "Donor name required");
        require(bytes(bloodGroup).length > 0, "Blood group required");
        require(bytes(dateTime).length > 0, "Date time required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(hospitalName).length > 0, "Hospital name required");

        bytes32 blockHash = keccak256(abi.encodePacked(donationCount, donorName, bloodGroup, block.timestamp, msg.sender));

        Donation memory newDonation = Donation({
            id: donationCount,
            donorName: donorName,
            bloodGroup: bloodGroup,
            dateTime: dateTime,
            location: location,
            hospitalName: hospitalName,
            donatedBy: msg.sender,
            timestamp: block.timestamp,
            blockHash: blockHash
        });

        donations.push(newDonation);
        donorHistory[msg.sender].push(donationCount);
        emit DonationAdded(donationCount, bloodGroup, msg.sender, blockHash);
        donationCount++;
    }

    function getAllDonations() public view returns (Donation[] memory) {
        return donations;
    }

    function getDonationById(uint256 id) public view returns (Donation memory) {
        require(id < donationCount, "Invalid donation ID");
        return donations[id];
    }

    function getDonationsByBloodGroup(string memory bloodGroup) public view returns (Donation[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (keccak256(abi.encodePacked(donations[i].bloodGroup)) == keccak256(abi.encodePacked(bloodGroup))) {
                count++;
            }
        }

        Donation[] memory result = new Donation[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (keccak256(abi.encodePacked(donations[i].bloodGroup)) == keccak256(abi.encodePacked(bloodGroup))) {
                result[index] = donations[i];
                index++;
            }
        }
        return result;
    }

    function getMyDonations() public view returns (Donation[] memory) {
        uint256[] memory ids = donorHistory[msg.sender];
        Donation[] memory result = new Donation[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = donations[ids[i]];
        }
        return result;
    }

    function getDonationCount() public view returns (uint256) {
        return donationCount;
    }
}
