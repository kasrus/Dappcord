const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const NAME = "Dappcord";
const SYMBOL = "DC";

describe("Dappcord", ()=> {
  let dappcord;
  let deployer, user;

  beforeEach(async() => {
    //Get the accounts connected to the blockchain
    [deployer, user] = await ethers.getSigners();
    const Dappcord = await ethers.getContractFactory(NAME);
    dappcord = await Dappcord.deploy(NAME, SYMBOL);
    
    //Create a channel
    const transaction = await dappcord.connect(deployer).createChannel("general", tokens(1));
    await transaction.wait();
  })

  describe("Deployment", () => {
    it("Sets the name", async() => {
      expect(await dappcord.name()).to.equal(NAME);
    })

    it("Sets the symbol", async() => {
      expect(await dappcord.symbol()).to.equal(SYMBOL);
    })

    it("Sets the owner", async() => {
      expect(await dappcord.owner()).to.equal(deployer.address);
    })
  })
  
  describe("Creating Channels", () => {
    it("Returns the total number of the channels", async() => {
      expect(await(dappcord).totalChannels()).to.equal(1);
    })

    it("Returns channel attributes", async() => {
      const channel = await dappcord.getChannel(1);
      expect(await channel.id).to.equal(1);
      expect(await channel.name).to.equal("general");
      expect(await channel.cost).to.equal(tokens(1));
    })
  })

  describe("Joining Channels", () => {
    const ID = 1;
    const AMOUNT = tokens(1);
    let transaction;

    beforeEach(async() => {    
      transaction = await dappcord.connect(user).mint(ID, { value: AMOUNT });
      await transaction.wait();
    })

    describe("Success", async() => { 
      it("Joins the user", async() => {
        expect(await dappcord.hasJoined(ID, user.address)).to.equal(true);
      })
  
      it("Increases total supply", async() => {
        expect(await dappcord.totalSupply()).to.equal(1);
      })
  
      it ("Updates the contract balance", async() => {
        const result = await ethers.provider.getBalance(dappcord.address);
        expect(result).to.equal(AMOUNT);
      })
    })
    
    describe("Failure", async() => {
      it("Rejects when channel id is 0", async() => {
        await expect(dappcord.connect(user).mint(0, { value: AMOUNT })).to.be.reverted;
      })

      it("Rejects when channel id is greater than the number of channels", async() => {
        await expect(dappcord.connect(user).mint(10, { value: AMOUNT })).to.be.reverted;
      })

      it("Rejects when the user already joined the channel", async() => {
        await expect(dappcord.connect(user).mint(ID, { value: AMOUNT})).to.be.reverted;
      })

      it("Rejects when insuficient fund", async() => {
        const transaction = await dappcord.connect(deployer).createChannel("testing", tokens(10));
        await transaction.wait();
        await expect(dappcord.connect(user).mint(2, { value: AMOUNT})).to.be.reverted;
      })
    })
  })

  describe("Withdrawing ethers", () => {
    const ID = 1;
    const AMOUNT = tokens(10);
    let balanceBefore;

    beforeEach(async() => {
      balanceBefore = await ethers.provider.getBalance(deployer.address);
      
      let transaction = await dappcord.connect(user).mint(ID, { value: AMOUNT });
      await transaction.wait();

      transaction = await dappcord.connect(deployer).withdraw();
      await transaction.wait();
    })

    it("Updates the owner balance", async() => {
      let balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    })

    it("Updates the contract balance", async() => {
      expect(await ethers.provider.getBalance(dappcord.address)).to.equal(0);
    })
  })
})