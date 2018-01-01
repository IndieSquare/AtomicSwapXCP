import { Component, OnInit } from '@angular/core';
import {HTTPService} from "../services/http.service";
import { ActivatedRoute }     from '@angular/router';
import { PersistenceService, StorageType } from 'angular-persistence';
declare var tools:any;
declare var SwapLib:any;
declare var PeerLib:any;
@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  providers:[HTTPService],
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {
address = "";
btgAddress="";
balance="";
currentGiveToken = "";
currentGetToken = "";
currentGetChain = -1;
currentGiveChain = -1;
usdVal=0;
fiatBalance = "";
errorMessage = "";
loading=false;
balanceVal=0;
getAmount=0;
giveAmount=0;  
onlineSwaps = [];
chains = [];
btcTokens = [];
monaTokens = [];
etherTokens = [];
matches = [];
swapLib;
peerLib;
userSecretSeedMnemonic = "";
userWif = "";
userAddress = "";
connected = false;
currentSwaps = {};
connecting = false;

//cV2TbB8kzoa8pv1F7h5Z68x2fykASVqLunaxHyYjDewgRd7XG95g alice wif
//cQHoaSq5v7AWeqnQSfzth5em73yEL2JySk6mU7hdocXbCqmoyg2p bobs wif
//L5eyNqLHTnxPubBfuq6FBk3p18FKmWLu1tTmLFpL1ZuszZNKPHBP charles wif

  constructor(private httpService:HTTPService,private persistenceService: PersistenceService,private route: ActivatedRoute) {
      route.queryParams.subscribe(
      data =>  this.userWif = data['wif']);
  }

  connect(){

  	this.userAddress = this.swapLib.getP2SHP2WKHAddress(this.userWif);

  	console.log(this.userAddress);
	this.connecting = true;
  	
  	this.peerLib.connect(this,this.userAddress);

  	this.userSecretSeedMnemonic = this.persistenceService.get("secretSeedMnemonic",   StorageType.LOCAL);
    if(typeof this.userSecretSeedMnemonic  == "undefined"){
     	 this.userSecretSeedMnemonic =  this.swapLib.generateSecretSeedMnemonic();
     	 console.log("seed "+this.userSecretSeedMnemonic);
     	 this.persistenceService.set("secretSeedMnemonic",this.userSecretSeedMnemonic , {type: StorageType.LOCAL}); 
    } 

    	if(this.userAddress == "2NDANo9jFdJfhtwu3GhhLY3SjZEtMh1pqCS"){

  		this.currentGetChain = 0;
  		this.currentGiveChain = 0;
  		this.currentGetToken = "XCP";
  		this.currentGiveToken = "BTC";
  		this.getAmount = 0.001;
  		this.giveAmount = 0.001;
  		}
  		else if(this.userAddress == "2N3Pnu8LwirBEfDgP6URyrPWtYL6Fu23irR"){
  		this.currentGetChain = 0;
  		this.currentGiveChain = 0;
  		this.currentGetToken = "BTC";
  		this.currentGiveToken = "XCP";
  		this.getAmount = 0.001;
  		this.giveAmount = 0.001;
  		}

  		 

  }
  ngOnInit() {
  	 
  	this.swapLib = new SwapLib();
   this.peerLib = new PeerLib();

  

  

    this.chains = [
  	{
  		"name":"Bitcoin",
  		"list_name":"Bitcoin - Counterparty",
  		"id":0
  	},
  	{
  		"name":"Monacoin",
  		"list_name":"Monacoin - Monaparty",
  		"id":1
  	},
  	{
  		"name":"Ethereum",
  		"list_name":"Ethereum - ERC20",
  		"id":2
  	}
  	];

  	this.btcTokens = [
  		{
  			"name":"BTC",
  			"abrev":"BTC"
		},
		{
  			"name":"XCP",
  			"abrev":"XCP"
		},

  		];


  	this.monaTokens = [
  		{
  			"name":"MONACOIN",
  			"abrev":"MCT"
		},
		{
  			"name":"MCP",
  			"abrev":"MCP"
		},

  		];

  	this.etherTokens = [
  		{
  			"name":"ETHER",
  			"abrev":"ETH"
		} 

  		];


  			 
    		 
  	
  }
  loadCurrentSwaps(){

  		var currentSwapsString = this.persistenceService.get("currentSwapsV1"+this.userAddress,   StorageType.LOCAL);
  		 
    		if(typeof currentSwapsString == "undefined"){

    			this.currentSwaps = {};


    		}else{
    				this.currentSwaps = JSON.parse(	currentSwapsString );
    		}

    			console.log(this.currentSwaps);
    		
 			for (var swapId in this.currentSwaps){
   			 	if (this.currentSwaps.hasOwnProperty(swapId)) {
        			var aSwap = this.currentSwaps[swapId];

        			if(aSwap.status == "a0"){

        				 this.peerLib.advertiseSwap(this.userAddress,swapId,aSwap);
        			}
        			else if(aSwap.status == "4" || aSwap.status == "errorB1" ){

        				 this.broadcastBobs(swapId);
        			}
  		 
  				 
  					 
    			}
			}


  }
  getLastSecretIndex(){
  	var lastIndex = this.persistenceService.get("lastSecretIndexV1",   StorageType.LOCAL);
    if(typeof lastIndex  == "undefined"){
     	 lastIndex = 0;
     	 
    } 

    this.persistenceService.set("lastSecretIndexV1", lastIndex+1 , {type: StorageType.LOCAL}); 
    return lastIndex;
  }
  getOnlineSwaps(){

    this.onlineSwaps = this.peerLib.getOnlineSwaps();
  	 console.log(this.onlineSwaps);
  	return this.onlineSwaps;

  }

   getCurrentSwaps(){

   
     return this.currentSwaps;	 
     
  }


   search(array, key, prop){
   
    for (var i=0; i < array.length; i++) { 
        if (array[i][key] === prop) {
            return array[i];
        }
    }
    return null;
}
  getChainName(chainId){
  	 
  	var res = this.search(this.chains, "id", chainId);
  	if(res != null){
  		return res.name;
  	}
  	return "";
  }
  getGiveChainName(){
  	if(this.currentGiveChain == -1){
  		return "Select chain";
  	}else{
  		return this.getChainName(this.currentGiveChain);
  	}
  }
  getGetChainName(){
  	if(this.currentGetChain == -1){
  		return "Select chain";
  	}else{
  		return this.getChainName(this.currentGetChain);
  	}
  }
   getGetTokenName(){
  	if(this.currentGetToken == ""){
  		return "Select chain";
  	}else{
  		return this.currentGetToken;
  	}
  }
    getGiveTokenName(){
  	if(this.currentGiveToken == ""){
  		return "Select chain";
  	}else{
  		return this.currentGiveToken;
  	}
  }
  selectGiveChain(chain){
  	this.currentGiveChain = chain.id;
  }
  selectGetChain(chain){
  	this.currentGetChain = chain.id;
  }
  selectGiveToken(token){
  	this.currentGiveToken = token.name;
  }
  selectGetToken(token){
  	this.currentGetToken = token.name;
  }
    getTokensGive(){

  	if(this.currentGiveChain == 0){

  		return this.btcTokens;
  	}else if(this.currentGiveChain == 1){

  		return this.monaTokens;
  	}
  	else if(this.currentGiveChain == 2){

  		return this.etherTokens;
  	}
  	else{
  		return [];
  	}


  	 
  }

    getTokensGet(){
  	if(this.currentGetChain == 0){

  		return this.btcTokens;
  	}else if(this.currentGetChain == 1){

  		return this.monaTokens;
  	}
  	else if(this.currentGetChain == 2){

  		return this.etherTokens;
  	}
  	else{
  		return [];
  	}

  	 
  }
  advertiseSwap(){

  	var satoshisGiveAmount = this.giveAmount * 100000000;
  		var satoshisGetAmount = this.getAmount * 100000000;
  		console.log(satoshisGiveAmount + " "+this.currentGiveToken + " "+satoshisGetAmount + " "+this.currentGetToken);

  		var swapId = tools.bitcoin.crypto.sha256(tools.bitcoin.ECPair.makeRandom().getAddress()).toString('hex');

  	
  	var swapData = {
  		"status":"a0",
  		"give_token":this.currentGiveToken,
  		"give_amount":satoshisGiveAmount,
  		"get_token":this.currentGetToken,
  		"get_amount":satoshisGetAmount
  	};

  	this.currentSwaps[swapId] = swapData;
  	console.log(this.currentSwaps)
  	this.saveCurrentSwaps();

this.peerLib.advertiseSwap(this.userAddress,swapId,swapData);

  		this.currentGetChain = -1;
  		this.currentGiveChain = -1;
  		this.currentGetToken = "";
  		this.currentGiveToken = "";
  		this.getAmount = 0;
  		this.giveAmount = 0;

  }

  
  makeSwap(secretHash,swapId,data){
  	this.currentSwaps[swapId].status = "b2";
  	this.saveCurrentSwaps();
  	var tmpthis = this;
     console.log("making cont");
     var params = {
     	"swapId":swapId,
     	"userPrivKey":this.userWif,
     	"alicesAddress":this.userAddress,
     	"bobsAddress":data.address,
     	"sendToken":data.get_token,
     	"sendAmount":data.get_amount,
     	"userSecretSeedMnemonic":this.userSecretSeedMnemonic,
     	"currentPathIndex":this.getLastSecretIndex(),
     	"secretHash":secretHash
     };

    this.swapLib.createSwapTransaction(params,
    
    function successCallback(hex,secret,secretHash,swapId){

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"swapId":swapId
    	}
    	tmpthis.addToRedeemScripts(params);

    	console.log("bob hex "+hex);
    	tmpthis.currentSwaps[swapId].status = "b3";
    	tmpthis.saveCurrentSwaps();
    	tmpthis.peerLib.sendHex(swapId,tmpthis.userAddress,hex);

    	tmpthis.broadcastBobs(swapId);
		 
    },
    function errorCallback(error){
    	console.log("error "+error);
    	alert(error);
    });
  }

  removeSwap(swapId){

 
  		 delete this.currentSwaps[swapId];
	 
  		 this.saveCurrentSwaps(); 
  }

  showSwapSpinner(swapId){
  	return false;
  /*	var swapId = this.currentSwaps[swapId];
  	if(swapId.status != "error"){
  		return true;
  	}
  	return false;*/
  }

  getStatus(num){
  	if(num == "a0"){
  		return "waiting for match...";
  	}
  	else if(num == "a1"){
  		return "creating transaction";
  	}
  	else if(num == "b1"){
  		return "waiting for other party";
  	}
  	else if(num == "a2"){
  		return "waiting for other party";
  	}
  	else if(num == "b2"){
  		return "creating transaction";
  	}
  	else if(num == "a3"){
  		return "checking transaction";
  	}
  	else if(num == "b3"){
  		return "checking transaction";
  	}
  	else if(num == "4"){
  		return "broadcasting...";
  	}
  	else if(num == "5"){
  		return "waiting for confirmation";
  	}
  	else if(num == "error"){
  		return "error creating transaction";
  	}
  	else if(num == "errorB1"){
  		return "error broadcasting";
  	}



  }
  getCurrentSwapKeys(){
  	return Object.keys(this.currentSwaps);
  }
  startWait(data){
  	this.currentSwaps[data.swap_id].status = "b1";
  	this.saveCurrentSwaps();

  }
  startSwap(data){
  	
  	this.currentSwaps[data.swap_id].status = "a1";
    this.saveCurrentSwaps();

  	var tmpthis = this;
     console.log("here went");
     var params = {
     	"swapId":data.swap_id,
     	"userPrivKey":this.userWif,
     	"alicesAddress":this.userAddress,
     	"bobsAddress":data.data.address,
     	"sendToken":data.data.get_token,
     	"sendAmount":data.data.get_amount,
     	"userSecretSeedMnemonic":this.userSecretSeedMnemonic,
     	"currentPathIndex":this.getLastSecretIndex()
     };

    this.swapLib.createSwapTransaction(params,
    
    function successCallback(hex,secret,secretHash,swapId){
    	console.log("alice hex "+hex);
    	console.log("secret "+secret);
    	console.log("secretHash "+secretHash);

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"swapId":swapId
    	}
    	tmpthis.addToRedeemScripts(params);

    	tmpthis.peerLib.continueSwap(swapId,secretHash,tmpthis.userAddress,hex);
		 tmpthis.currentSwaps[swapId].status = "a2";
		 tmpthis.saveCurrentSwaps();

    },
    function errorCallback(error,swapId){
    	 
    	tmpthis.currentSwaps[swapId].status = "error";
    	tmpthis.saveCurrentSwaps();

    	alert(error);
    });

  }
  getChains(){
  return this.chains;
  }

  getFiatVal(){
	 

	 this.httpService.getFiatVal().subscribe(
     data => { 
  		 
       this.usdVal = data[0].price_usd * this.balanceVal;
       this.fiatBalance = this.usdVal+" USD";
     },
       error => {
      
 
       },
     () => {});
}

saveTheirTransaction(swapId,hex){ 
	this.currentSwaps[swapId].their_transaction = hex;
	this.saveCurrentSwaps();
}
broadcastBobs(swapId){

	var tmpthis = this;
 
	tmpthis.currentSwaps[swapId].status = "4";
	var hex = tmpthis.currentSwaps[swapId].their_transaction;
	tmpthis.saveCurrentSwaps(); 
	var params = {
		"hex":hex,
		"swapId":swapId
	}

	this.swapLib.broadcastInitial(params,
	
	function successCallback(txid,swapId2){
    	 
    	 tmpthis.currentSwaps[swapId].status = "5"; 
    	 tmpthis.saveCurrentSwaps();

    },
    function errorCallback(error,swapId2){
    	console.log("er3 "+swapId2);
    	 tmpthis.currentSwaps[swapId].status = "errorB1"; 
    	 tmpthis.saveCurrentSwaps();

    	 
    });

}

 addToRedeemScripts(params){
 	

     
    	var redeemScript = {
    		"secret":params.secret,
    		"secretHash":params.secretHash,
    		"transaction":params.hex,
    	}
    	this.currentSwaps[params.swapId].redeemScript = redeemScript;

    	this.saveCurrentSwaps();
 }
 saveCurrentSwaps(){

 	this.persistenceService.set("currentSwapsV1"+this.userAddress, JSON.stringify(this.currentSwaps), {type: StorageType.LOCAL});
 }
 setGiveAmount(val:number){
	this.giveAmount = val;
 

}
setGetAmount(val:number){
	this.getAmount = val;
 

}
 

}
