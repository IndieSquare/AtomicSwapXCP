import { Component, OnInit } from '@angular/core';
import {HTTPService} from "../services/http.service";
import {DataService} from "../services/data.service";
import { ActivatedRoute }     from '@angular/router';
import { SwapItemComponent } from '../swap-item/swap-item.component';
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

connected = false;

connecting = false;

self:any;

//cV2TbB8kzoa8pv1F7h5Z68x2fykASVqLunaxHyYjDewgRd7XG95g alice wif
//cQHoaSq5v7AWeqnQSfzth5em73yEL2JySk6mU7hdocXbCqmoyg2p bobs wif
//L5eyNqLHTnxPubBfuq6FBk3p18FKmWLu1tTmLFpL1ZuszZNKPHBP charles wif

  constructor(private httpService:HTTPService,private dataService:DataService,private persistenceService: PersistenceService,private route: ActivatedRoute) {
      route.queryParams.subscribe(
      data =>  this.dataService.userWif = data['wif']);
  }
   startSwap(data){
  	
  	this.dataService.swapObjects[data.swap_id].startSwap(data);
   

	}
  connect(){

  	this.dataService.userAddress = this.swapLib.getAddress(this.dataService.userWif);

  	console.log(this.dataService.userAddress);
	this.connecting = true;
  	
  	this.dataService.peerLib.connect(this,this.dataService.userAddress);

  	this.dataService.userSecretSeedMnemonic = this.persistenceService.get("secretSeedMnemonic",   StorageType.LOCAL);
    if(typeof this.dataService.userSecretSeedMnemonic  == "undefined"){
     	this.dataService.userSecretSeedMnemonic =  this.swapLib.generateSecretSeedMnemonic();
     	 console.log("seed "+this.dataService.userSecretSeedMnemonic);
     	 this.persistenceService.set("secretSeedMnemonic",this.dataService.userSecretSeedMnemonic , {type: StorageType.LOCAL}); 
    } 

    	if(this.dataService.userAddress == "2NDANo9jFdJfhtwu3GhhLY3SjZEtMh1pqCS" || this.dataService.userAddress == "moJAUvfe8SGbkqnor3xRpuCD4oPJmbNExN"){

  		this.currentGetChain = 0;
  		this.currentGiveChain = 0;
  		this.currentGetToken = "XCP";
  		this.currentGiveToken = "BTC";
  		this.getAmount = 0.001;
  		this.giveAmount = 0.001;
  		}
  		else if(this.dataService.userAddress == "2N3Pnu8LwirBEfDgP6URyrPWtYL6Fu23irR" ||this.dataService.userAddress == "mqKy9agnNopat7WAsyzkgrJr5z5JisSzbz"){
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
  

  
this.self = this;
  

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

  		var currentSwapsString = this.persistenceService.get("currentSwapsV1"+this.dataService.userAddress,   StorageType.LOCAL);
  		 
    		if(typeof currentSwapsString == "undefined"){

    			this.dataService.currentSwaps = {};


    		}else{
    				this.dataService.currentSwaps = JSON.parse(	currentSwapsString );
    		}

    			console.log(this.dataService.currentSwaps);
    		 
    	 
 			for (var swapId in this.dataService.currentSwaps){
   			 	

			 
setTimeout(function(){document.getElementById("openSwaps").click();
	 ;},500)
			
 

  }

}
  getOnlinePeers(){
  	return this.dataService.peerLib.getOnlinePeers();
  }
 

  
 

  getOnlineSwaps(){

    this.onlineSwaps = this.dataService.peerLib.getOnlineSwaps();
  	 
  	return this.onlineSwaps;

  }

   getCurrentSwapKeys(){

   var results = {};
  	 for (var aKey in this.dataService.currentSwaps) { 
        var aSwap = this.dataService.currentSwaps[aKey];
        if(aSwap.status != "9" && aSwap.status != "r4"){
results[aKey]=aSwap;
        }
    }
   
    return Object.keys(results);	 
      
     
  }

  getHistoryKeys(){
 var results = {};
  	 for (var aKey in this.dataService.currentSwaps) { 
        var aSwap = this.dataService.currentSwaps[aKey];
        if(aSwap.status == "9" || aSwap.status == "r4"){
results[aKey]=aSwap;
        }
    }
   
     return Object.keys(results);	 	 
     
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

  	setTimeout(function(){document.getElementById("currentSwaps").click();},100)
  	
  	if(this.currentGiveChain == -1 || this.currentGiveChain == -1 || this.currentGiveToken == "" || this.currentGetToken == "" || this.getAmount == 0 || this.giveAmount == 0){
  		alert("invalid settings");
  		return;
  	}

  	var satoshisGiveAmount = this.giveAmount * 100000000;
  	var satoshisGetAmount = this.getAmount * 100000000;
  	console.log(satoshisGiveAmount + " "+this.currentGiveToken + " "+satoshisGetAmount + " "+this.currentGetToken);

  	var swapId = tools.bitcoin.crypto.sha256(tools.bitcoin.ECPair.makeRandom().getAddress()).toString('hex');

  	var swapData = {
  		"status":"a0",
  		"my_address":this.dataService.userAddress,
  		"give_token":this.currentGiveToken,
  		"give_amount":satoshisGiveAmount,
  		"get_token":this.currentGetToken,
  		"get_amount":satoshisGetAmount
  	};

  	this.dataService.currentSwaps[swapId] = swapData;
  	console.log(this.dataService.currentSwaps)
  	this.dataService.saveCurrentSwaps();

	this.dataService.peerLib.advertiseSwap(this.dataService.userAddress,swapId,swapData);

  	this.currentGetChain = -1;
  	this.currentGiveChain = -1;
  	this.currentGetToken = "";
  	this.currentGiveToken = "";
  	this.getAmount = 0;
  	this.giveAmount = 0;

  }
 

 

 changeTab(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

 
   
  getChains(){
  return this.chains;
  }
 


 
 setGiveAmount(val:number){
	this.giveAmount = val;
 

}
setGetAmount(val:number){
	this.getAmount = val;
 

}
 

}
