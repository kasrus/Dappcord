// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Dappcord is ERC721 {
    uint public totalChannels;
    uint public totalSupply;
    address public owner;

    struct Channel {
        uint id;
        string name;
        uint cost;
    }

    mapping (uint=> Channel) public channels;
    mapping (uint => mapping(address => bool)) public hasJoined;

    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        owner = msg.sender;
    }

    function createChannel(string memory _name, uint _cost) public onlyOwner {
        totalChannels++;
        channels[totalChannels] = Channel(totalChannels, _name, _cost);
    }

    function mint(uint _id) public payable {
        require(_id != 0);
        require(_id <= totalChannels);
        require(hasJoined[_id][msg.sender] == false);
        require(msg.value >= channels[_id].cost);

        //Join channel
        hasJoined[_id][msg.sender] = true;

        //Mint NFT
        totalSupply++;
        _safeMint(msg.sender, totalSupply);
    }
    
    function getChannel(uint _id) public view returns(Channel memory) {
        return channels[_id];
    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}
