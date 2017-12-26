import { Component, OnInit } from '@angular/core';
import {HTTPService} from "../services/http.service";
import { PersistenceService, StorageType } from 'angular-persistence';
declare var tools:any;
declare var SwapLib:any;
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
peers = [];
chains = [];
btcTokens = [];
monaTokens = [];
etherTokens = [];
matches = [];
swapLib;
userSecretSeedMnemonic = "";
userWif = "";
userAddress = "";

//Kyvp7XqEV3UFVQK94GBmKm9hUpfpfaDHNhxJMhF8JVsax6fDi5vk bobs wif
//L5eyNqLHTnxPubBfuq6FBk3p18FKmWLu1tTmLFpL1ZuszZNKPHBP charles wif

  constructor(private httpService:HTTPService,private persistenceService: PersistenceService) { }

  ngOnInit() {
  	
  	this.swapLib = new SwapLib();

  	this.userSecretSeedMnemonic = this.persistenceService.get("secretSeedMnemonic",   StorageType.LOCAL);
    if(typeof this.userSecretSeedMnemonic  == "undefined"){
     	 this.userSecretSeedMnemonic =  this.swapLib.generateSecretSeedMnemonic();
     	 console.log("seed "+this.userSecretSeedMnemonic);
     	 this.persistenceService.set("secretSeedMnemonic",this.userSecretSeedMnemonic , {type: StorageType.LOCAL}); 
    } 

  	 
   this.userWif = "L4fU8G8uZjssfUXyjHGRipSy3kSkn3jeqkSVBZ6DiYHgAt21BmMf";
   this.userAddress = "2N3Pnu8LwirBEfDgP6URyrPWtYL6Fu23irR";

  

   this.peers = [
   {
   	"address":"2NDANo9jFdJfhtwu3GhhLY3SjZEtMh1pqCS",
   	"give_token":"BTC",
   	"give_amount":100000000,
   	"get_token":"XCP",
   	"get_amount":100000000,

   },
   {
   	"address":"2N3GguFFUde6XWcFHZSMr6qGd8SoJDjyzNE",
   	"give_token":"XCP",
   	"give_amount":100000000,
   	"get_token":"BTC",
   	"get_amount":100000000,
   }
   ];

  

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

  		this.currentGetChain = 0;
  		this.currentGiveChain = 0;
  		this.currentGetToken = "XCP";
  		this.currentGiveToken = "BTC";
  		this.getAmount = 1;
  		this.giveAmount = 1;
  	
  }
  getLastSecretIndex(){
  	var lastIndex = this.persistenceService.get("lastSecretIndexV1",   StorageType.LOCAL);
    if(typeof lastIndex  == "undefined"){
     	 lastIndex = 0;
     	 
    } 

    this.persistenceService.set("lastSecretIndexV1", lastIndex+1 , {type: StorageType.LOCAL}); 
    return lastIndex;
  }
  getPeers(){
  	return this.peers;
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
    
  updateMatches(){

  
  	var satoshisGiveAmount = this.giveAmount * 100000000;
  		var satoshisGetAmount = this.getAmount * 100000000;

  			console.log(satoshisGiveAmount + " "+this.currentGiveToken + " "+satoshisGetAmount + " "+this.currentGetToken);
this.matches = [];
  	 for (var i=0; i < this.peers.length; i++) {
  	 	var aPeer = this.peers[i];
  	 	console.log(aPeer);
  	 	if(aPeer.give_token == this.currentGetToken && aPeer.get_token == this.currentGiveToken && aPeer.give_amount == satoshisGetAmount && aPeer.get_amount == satoshisGiveAmount){
  	 		this.matches.push(aPeer);
  	 	}
    	 
    }

   

  }
  swap(aPeer){
    
    this.swapLib.createSwapTransaction(this.userAddress,aPeer.address,this.currentGiveToken,this.giveAmount, this.userSecretSeedMnemonic,this.getLastSecretIndex(),
    
    function successCallback(txid){
    	console.log("here4 "+txid);
		alert(txid);
    },
    function errorCallback(error){
    	console.log("here3 "+error);
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

checkBalance(){

	this.errorMessage = "";
	this.balance = "";



	if(this.btgAddress.length < 1){
		this.errorMessage = "please enter a valid address";
		return;
	}
    

	this.loading = true;

	 this.httpService.getBalance(this.btgAddress).subscribe(
     data => { 
  		this.loading = false;
  		this.balanceVal = data.balance;
  		this.balance = data.balance+" BTG";
  		  this.getFiatVal();
       
     },
       error => {
       	this.loading = false;
 		this.errorMessage = "error";
 
       },
     () => {});

   


}
 setGiveAmount(val:number){
	this.giveAmount = val;
 

}
setGetAmount(val:number){
	this.getAmount = val;
 

}
 

}
