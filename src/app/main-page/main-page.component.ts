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
CONFIRMATIONS_NUM = 1;

//cV2TbB8kzoa8pv1F7h5Z68x2fykASVqLunaxHyYjDewgRd7XG95g alice wif
//cQHoaSq5v7AWeqnQSfzth5em73yEL2JySk6mU7hdocXbCqmoyg2p bobs wif
//L5eyNqLHTnxPubBfuq6FBk3p18FKmWLu1tTmLFpL1ZuszZNKPHBP charles wif

  constructor(private httpService:HTTPService,private persistenceService: PersistenceService,private route: ActivatedRoute) {
      route.queryParams.subscribe(
      data =>  this.userWif = data['wif']);
  }

  connect(){

  	this.userAddress = this.swapLib.getAddress(this.userWif);

  	console.log(this.userAddress);
	this.connecting = true;
  	
  	this.peerLib.connect(this,this.userAddress);

  	this.userSecretSeedMnemonic = this.persistenceService.get("secretSeedMnemonic",   StorageType.LOCAL);
    if(typeof this.userSecretSeedMnemonic  == "undefined"){
     	 this.userSecretSeedMnemonic =  this.swapLib.generateSecretSeedMnemonic();
     	 console.log("seed "+this.userSecretSeedMnemonic);
     	 this.persistenceService.set("secretSeedMnemonic",this.userSecretSeedMnemonic , {type: StorageType.LOCAL}); 
    } 

    	if(this.userAddress == "2NDANo9jFdJfhtwu3GhhLY3SjZEtMh1pqCS" || this.userAddress == "moJAUvfe8SGbkqnor3xRpuCD4oPJmbNExN"){

  		this.currentGetChain = 0;
  		this.currentGiveChain = 0;
  		this.currentGetToken = "XCP";
  		this.currentGiveToken = "BTC";
  		this.getAmount = 0.001;
  		this.giveAmount = 0.001;
  		}
  		else if(this.userAddress == "2N3Pnu8LwirBEfDgP6URyrPWtYL6Fu23irR" || this.userAddress == "mqKy9agnNopat7WAsyzkgrJr5z5JisSzbz"){
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
        			else if(aSwap.status == "5" || aSwap.status == "errorC" ){

        				 this.checkForConfirmation(swapId);
        			}
        			else if(aSwap.status == "6a" || aSwap.status == "errorCT"){
        				 
        				 this.claimToken(swapId);
        			}
        			else if(aSwap.status == "6b" || aSwap.status == "errorS"  ){
        				 
        				 this.searchForSecret(swapId);

        			}
        			else if(aSwap.status == "7" || aSwap.status == "errorBC"){
        				 
        				 this.broadcastClaim(swapId);

        			}
        			else if(aSwap.status == "8"){
        				 this.checkClaimConfirmation(swapId);

        			} 
        			else if(aSwap.status == "r2"){
        				 this.broadcastRefund(swapId);

        			}
        			else if(aSwap.status == "r3"){
        				  this.checkRefundConfirmation(swapId);

        			}

        			if(typeof aSwap.redeem_script != "undefined" && typeof aSwap.redeem_script.transaction != "undefined" && aSwap.status != "9"  && aSwap.status != "r2" && aSwap.status != "r3" && aSwap.status != "r4"){
        				this.checkRefund(swapId);
        			}
        			
        			
  		
  				 
  					 
    			}
			}

			 
setTimeout(function(){document.getElementById("openSwaps").click();
	 ;},500)
			
 

  }
  getOnlinePeers(){
  	return this.peerLib.getOnlinePeers();
  }
   broadcastRefund(swapId){
   
  	var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];
    	

    	var params = {
		"hex":theSwap.refund_tx,
		"swapId":swapId
	}	 

	tmpthis.swapLib.broadcastTx(params,
	
	function successCallback(txid,swapId){
    	 
    	 tmpthis.currentSwaps[swapId].status = "r3"; 
    	 tmpthis.saveCurrentSwaps();

    },
    function errorCallback(error,swapId){ 
    	 tmpthis.currentSwaps[swapId].status = "errorBR"; 
    	 tmpthis.saveCurrentSwaps();

    	 
    });

  }

  broadcastClaim(swapId){

  	var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];
    	
    	var params = {
		"hex":theSwap.claim_tx,
		"swapId":swapId
	}	 

	tmpthis.swapLib.broadcastTx(params,
	
	function successCallback(txid,swapId){
    	 
    	 tmpthis.currentSwaps[swapId].status = "8"; 
    	 tmpthis.saveCurrentSwaps();

    },
    function errorCallback(error,swapId){ 
    	 tmpthis.currentSwaps[swapId].status = "errorBC"; 
    	 tmpthis.saveCurrentSwaps();

    	 
    });

  }

  claimToken(swapId){


  	var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];

  	var secret = theSwap.redeem_script.secret;
  	if(typeof secret == "undefined"){
  		//is bob so need to wait for alice
  		//call check for secret;
  		return;

  	} 
  	console.log(theSwap);
  	 
  	var params = {
  		"leader":theSwap.leader,
  		"swap_id":swapId,
  		"hex":theSwap.their_transaction, 
  		"user_wif":this.userWif,
  		"secret":secret,
  		"my_address":theSwap.my_address,
  		"their_address":theSwap.their_address,
  		"get_token":theSwap.get_token,
  		"get_amount":theSwap.get_amount,
  	}
 
  	this.swapLib.claimToken(params,
    function successCallback(signedTx){
    	tmpthis.currentSwaps[swapId].status = "7";
    	tmpthis.currentSwaps[swapId].claim_tx = signedTx;
    	tmpthis.saveCurrentSwaps();



	    tmpthis.broadcastClaim(swapId);

    	
    	 

    },
    function errorCallback(error){
    	if(typeof tmpthis.currentSwaps[swapId].claim_tx != "undefined"){
    		 tmpthis.currentSwaps[swapId].status = "7";
    		  tmpthis.broadcastClaim(swapId);
    	}
    	else{
    	  tmpthis.currentSwaps[swapId].status = "errorCT";
    	}
    	 
    	tmpthis.saveCurrentSwaps();

    	alert("1"+error);
    	 
    });
   

  }

  checkForConfirmation(swapId){
var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];
 	theSwap.status = "5";
    	tmpthis.saveCurrentSwaps();
  	this.swapLib.checkConfirmation(theSwap.redeem_script.transaction,theSwap.their_address ,theSwap.my_address,
    function successCallback(confirmation){
    	
    	if(confirmation > tmpthis.CONFIRMATIONS_NUM - 1){

    		console.log("confirmations "+confirmation + " "+(tmpthis.CONFIRMATIONS_NUM - 1));
    		try{
    		var theSwap = tmpthis.currentSwaps[swapId];
    		var secret = theSwap.redeem_script.secret;
    	}
    	catch(e){
    		alert(e);
    	}

  			if(typeof secret == "undefined"){
  				//is bob so need to wait for secret from alices claim
    			tmpthis.currentSwaps[swapId].status = "6b";
    		}else{
    			//is alice so canclaim with secret

    			tmpthis.currentSwaps[swapId].status = "6a";
    		}
    		tmpthis.saveCurrentSwaps();

    		tmpthis.claimToken(swapId);
    		return;

    	}else{
    		tmpthis.currentSwaps[swapId].status = "5";
    	tmpthis.saveCurrentSwaps();
    		 setTimeout( function(){tmpthis.checkForConfirmation(swapId)}, 10000);
    	}
    	
    	 

    },
    function errorCallback(error){
    	//alert("2"+error);
    	 	tmpthis.currentSwaps[swapId].status = "errorC";
    	tmpthis.saveCurrentSwaps();
    	 setTimeout( function(){tmpthis.checkForConfirmation(swapId)}, 10000);
    	 
    	 
    });


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
  	 
  	return this.onlineSwaps;

  }

   getCurrentSwapKeys(){

   var results = {};
  	 for (var aKey in this.currentSwaps) { 
        var aSwap = this.currentSwaps[aKey];
        if(aSwap.status != "9" && aSwap.status != "r4"){
results[aKey]=aSwap;
        }
    }
   
    return Object.keys(results);	 
      
     
  }

  getHistoryKeys(){
 var results = {};
  	 for (var aKey in this.currentSwaps) { 
        var aSwap = this.currentSwaps[aKey];
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
  	setTimeout(function(){document.getElementById("currentSwaps").click();
	 ;},100)
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
  		"my_address":this.userAddress,
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

  	var aSwap = this.currentSwaps[swapId];
    aSwap.status = "b2";
  	aSwap.their_address = data.address;
  	aSwap.leader = false;
  	this.saveCurrentSwaps();
  	var tmpthis = this;
     console.log("making cont");
     var params = {
     	"leader":aSwap.leader,
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
    
    function successCallback(hex,scriptHex,secret,secretHash,swapId){

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
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
  isLeader(swapId){
  	var theSwap = this.currentSwaps[swapId];
  	return theSwap.leader;
  }

  checkRefund(swapId){
console.log("checking refund...");
  	var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];
  
  	var params = {
  		"swap_id":swapId,
  		"redeem_script":theSwap.redeem_script.script,
  		"hex":theSwap.redeem_script.transaction,  
  		"my_address":theSwap.my_address, 
  	}



  this.swapLib.checkRefund(params,
    function successCallback(timeTillRefund){

    	theSwap.redeem_script.time_till_refund = timeTillRefund;
    		tmpthis.saveCurrentSwaps();
    if(theSwap.redeem_script.time_till_refund == 0){
 
	    theSwap.status = "r1"; 
  	 	tmpthis.saveCurrentSwaps();
  	
  	 var newParams = {
  		"swap_id":swapId,
  		"leader":theSwap.leader,
  		"hex":theSwap.redeem_script.transaction, 
  		"user_wif":tmpthis.userWif, 
  		"secret_hash":theSwap.redeem_script.secret_hash,
  		"my_address":theSwap.my_address,
  		"their_address":theSwap.their_address,
  		"give_token":theSwap.give_token,
  		"give_amount":theSwap.give_amount,
  	}
 
  	tmpthis.swapLib.refundToken(newParams,
    function successCallback(signedTx){
    	tmpthis.currentSwaps[swapId].status = "r2";
    	tmpthis.currentSwaps[swapId].refund_tx = signedTx;
    	tmpthis.saveCurrentSwaps();
 
	    tmpthis.broadcastRefund(swapId);
 
    },
    function errorCallback(error){
    	 tmpthis.currentSwaps[swapId].status = "errorCR";
    	tmpthis.saveCurrentSwaps();

    	alert("1"+error);
    	 
    });


 }
 else{
 	setTimeout(function(){ tmpthis.checkRefund(swapId)},10000);
 }
    },
    function errorCallback(error){
    	console.log("error check refund "+error);
    	setTimeout(function(){ tmpthis.checkRefund(swapId)},10000);
    	 
    });
  	  

  }

  getRefundStatus(aSwapId){
  	var aSwap = this.currentSwaps[aSwapId];
  	var redeemScript = aSwap.redeem_script;
  	if(typeof redeemScript != "undefined"){
  	var timeTillRefund = redeemScript.time_till_refund;

   if(typeof  timeTillRefund != "undefined"){
  	if(typeof  timeTillRefund != "undefined"){
  		if( timeTillRefund == 0){
  			return "";
  		}
  	}
  }
   }
  		return "";
  }

  removeSwap(swapId){

 
  		 delete this.currentSwaps[swapId];
	 
  		 this.saveCurrentSwaps(); 
  }

  showRefund(swapId){
  	 
   
  		return true;
  	
  }

  showSwapSpinner(swapId){
  	 
  var swapId = this.currentSwaps[swapId];
  	if(swapId.status != "error" && swapId.status != "9" && swapId.status != "r4"){
  		return true;
  	}
  	return false;
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
  		return "waiting for confirmation...";
  	}
  	else if(num == "6a"){
  		return "claiming token...";
  	}
  	else if(num == "6b"){
  		return "waiting for other party to reveal secret";
  	}
  	else if(num == "7"){
  		return "broadcasting claim...";
  	}
  	else if(num == "8"){
  		return "waiting for claim confirmation....";
  	}
  	else if(num == "9"){
  		return "Claim complete!";
  	} 
  	else if(num == "error"){
  		return "error creating transaction";
  	}
  	else if(num == "errorB1"){
  		return "error broadcasting";
  	}
  	else if(num == "errorC"){
  		return "error checking confirmations";
  	}
  	else if(num == "errorS"){
  		return "error searching secret";
  	}
  	else if(num == "errorCT"){
  		return "error creating claim transaction";
  	}
  	else if(num == "errorBC"){
  		return "error broadcasting claim";
  	}
  	else if(num == "errorCR"){
  		return "error creating refund transaction";
  	}
  	else if(num == "errorBR"){
  		return "error broadcasting refund transaction";
  	}
  	else if(num == "r1"){
  		return "creating refund transaction";
  	}
  	else if(num == "r2"){
  		return "broadcasting refund transaction";
  	}
  	else if(num == "r3"){
  		return "waiting for refund confirmation";
  	}
  	else if(num == "r4"){
  		return "refund complete!";
  	}



  }
   
  startWait(data){
  	this.currentSwaps[data.swap_id].status = "b1";
  	this.saveCurrentSwaps();

  }
  checkClaimConfirmation(swapId){ 

var tmpthis = this;
  	var theSwap = this.currentSwaps[swapId];
 
  	this.swapLib.checkClaimConfirmation(theSwap.their_transaction,theSwap.claim_tx,theSwap.their_address,
    function successCallback(confirmation){
    	console.log("conf "+confirmation);
    	if(confirmation > tmpthis.CONFIRMATIONS_NUM - 1){

    		tmpthis.currentSwaps[swapId].status = "9";
    	 
    		tmpthis.saveCurrentSwaps();
 
    		return;

    	}else{
    			setTimeout(function(){ tmpthis.checkClaimConfirmation(swapId)}, 10000);

    	}
    	
    	 

    },
    function errorCallback(error){
  	setTimeout(function(){ tmpthis.checkClaimConfirmation(swapId)}, 10000);

    	 
    	 
    }); 

 

  }

    checkRefundConfirmation(swapId){ 

    var tmpthis = this;
  	var theSwap = tmpthis.currentSwaps[swapId];
 
  	this.swapLib.checkRefundConfirmation(theSwap.redeem_script.transaction,theSwap.refund_tx,theSwap.my_address,
    function successCallback(confirmation){
    	console.log("conf "+confirmation);
    	if(confirmation > tmpthis.CONFIRMATIONS_NUM - 1){

    		tmpthis.currentSwaps[swapId].status = "r4";
    	 
    		tmpthis.saveCurrentSwaps();
 
    		return;

    	}else{
    			setTimeout(function(){ tmpthis.checkRefundConfirmation(swapId)}, 10000);

    	}
    	
    	 

    },
    function errorCallback(error){
  	setTimeout(function(){ tmpthis.checkRefundConfirmation(swapId)}, 10000);

    	 
    	 
    }); 

 

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

  searchForSecret(swapId){
  	console.log("swid1 "+swapId);
var tmpthis = this;
  	var aSwap = this.currentSwaps[swapId];
    	var params = {  
    		"hex":aSwap.redeem_script.transaction,
    		"my_address":aSwap.my_address,
    		"their_address":aSwap.their_address,
    		"secret_hash":aSwap.redeem_script.secret_hash,
    		"swapId":swapId
    	}

  	this.swapLib.searchForSecret(params,
    
    function successCallback(secret){

    	if(secret != null){
    	console.log("the secret "+secret.toString('hex'));

    	tmpthis.currentSwaps[swapId].status = "6a";
    	tmpthis.currentSwaps[swapId].redeem_script["secret"] = secret.toString('hex');
  		tmpthis.saveCurrentSwaps();

  		tmpthis.claimToken(swapId);
  		}else{

    	 setTimeout(function(){tmpthis.searchForSecret(swapId)},10000);
    	}

    },
    function errorCallback(error,swapId){
    	console.log("swid"+swapId);
    	alert(error);
     	tmpthis.currentSwaps[swapId].status = "errorS";
  		tmpthis.saveCurrentSwaps();
  		setTimeout(function(){tmpthis.searchForSecret(swapId)},10000);
    });

  }
  startSwap(data){
  	
  	this.currentSwaps[data.swap_id].their_address = data.data.address;
  	this.currentSwaps[data.swap_id].status = "a1";
  	this.currentSwaps[data.swap_id].leader = true;
    this.saveCurrentSwaps();

  	var tmpthis = this;
     console.log("here went");
     var params = {
     	"swapId":data.swap_id,
     	"leader":this.currentSwaps[data.swap_id].leader,
     	"userPrivKey":this.userWif,
     	"alicesAddress":this.userAddress,
     	"bobsAddress":data.data.address,
     	"sendToken":data.data.get_token,
     	"sendAmount":data.data.get_amount,
     	"userSecretSeedMnemonic":this.userSecretSeedMnemonic,
     	"currentPathIndex":this.getLastSecretIndex()
     };

    this.swapLib.createSwapTransaction(params,
    
    function successCallback(hex,scriptHex,secret,secretHash,swapId){
    	console.log("alice hex "+hex);
    	console.log("secret "+secret);
    	console.log("secretHash "+secretHash);

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
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

	this.swapLib.broadcastTx(params,
	
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
    		"secret_hash":params.secretHash,
    		"transaction":params.hex,
    		"script":params.script
    	}
    	this.currentSwaps[params.swapId].redeem_script = redeemScript;

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
