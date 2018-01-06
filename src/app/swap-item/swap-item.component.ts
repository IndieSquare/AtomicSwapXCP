import { Component, OnInit, Input } from '@angular/core';
import { MainPageComponent } from '../main-page/main-page.component';

import {DataService} from "../services/data.service";

declare var SwapLib:any;
declare var PeerLib:any;

@Component({
  selector: 'app-swap-item',
  templateUrl: './swap-item.component.html',
  styleUrls: ['./swap-item.component.css']
})
export class SwapItemComponent implements OnInit {
 @Input() swapId: string;
 @Input() aSwap: any;
 @Input() type: string;
 @Input() controller: MainPageComponent;
 swapLib;
 peerLib;

  constructor(private dataService:DataService) { }

  ngOnInit() {
  		this.swapLib = new SwapLib();
  		this.peerLib = new PeerLib();

  		this.dataService.swapObjects[this.swapId] = this;


  		this.checkState();
  }

  checkState(){
  	if (this.dataService.currentSwaps.hasOwnProperty(this.swapId)) {
        			var aSwap = this.dataService.currentSwaps[this.swapId];

        			if(aSwap.status == "a0"){

        				 this.dataService.peerLib.advertiseSwap(this.dataService.userAddress,this.swapId,aSwap);
        			}
        			else if(aSwap.status == "4" || aSwap.status == "errorB1" ){

        				 this.broadcastBobs();
        			}
        			else if(aSwap.status == "5" || aSwap.status == "errorC" ){

        				 this.checkForConfirmation();
        			}
        			else if(aSwap.status == "6a" || aSwap.status == "errorCT"){
        				 
        				 this.claimToken();
        			}
        			else if(aSwap.status == "6b" || aSwap.status == "errorS"  ){
        				 
        				 this.searchForSecret();

        			}
        			else if(aSwap.status == "7" || aSwap.status == "errorBC"){
        				 
        				 this.broadcastClaim();

        			}
        			else if(aSwap.status == "8"){
        				 this.checkClaimConfirmation();

        			} 
        			else if(aSwap.status == "r2"){
        				 this.broadcastRefund();

        			}
        			else if(aSwap.status == "r3"){
        				  this.checkRefundConfirmation();

        			}

        			if(typeof aSwap.redeem_script != "undefined" && typeof aSwap.redeem_script.transaction != "undefined" && aSwap.status != "9"  && aSwap.status != "r2" && aSwap.status != "r3" && aSwap.status != "r4"){
        				this.checkRefund();
        			}
        			
        			
  		
  				 
			}
  }
  checkRefund(){
console.log("checking refund...");
  	var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];
  
  	var params = { 
  		"redeem_script":theSwap.redeem_script.script,
  		"hex":theSwap.redeem_script.transaction,  
  		"my_address":theSwap.my_address, 
  	}



  this.swapLib.checkRefund(params,
    function successCallback(timeTillRefund){

    	theSwap.redeem_script.time_till_refund = timeTillRefund;
    		tmpthis.dataService.saveCurrentSwaps();
    if(theSwap.redeem_script.time_till_refund == 0){
 
	    theSwap.status = "r1"; 
  	 	tmpthis.dataService.saveCurrentSwaps();
  	
  	 var newParams = { 
  		"leader":theSwap.leader,
  		"hex":theSwap.redeem_script.transaction, 
  		"user_wif":tmpthis.dataService.userWif, 
  		"secret_hash":theSwap.redeem_script.secret_hash,
  		"my_address":theSwap.my_address,
  		"their_address":theSwap.their_address,
  		"give_token":theSwap.give_token,
  		"give_amount":theSwap.give_amount,
  	}
 
  	tmpthis.swapLib.refundToken(newParams,
    function successCallback(signedTx){
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "r2";
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_tx = signedTx;
    	tmpthis.dataService.saveCurrentSwaps();
 
	    tmpthis.broadcastRefund();
 
    },
    function errorCallback(error){
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorCR";
    	tmpthis.dataService.saveCurrentSwaps();

    	alert("1"+error);
    	 
    });


 }
 else{
 	setTimeout(function(){ tmpthis.checkRefund()},10000);
 }
    },
    function errorCallback(error){
    	console.log("error check refund "+error);
    	setTimeout(function(){ tmpthis.checkRefund()},10000);
    	 
    });
  	  

  }
  broadcastRefund(){
   
  	var tmpthis = this;
  	var theSwap = tmpthis.dataService.currentSwaps[tmpthis.swapId];
    	

    	var params = {
		"hex":theSwap.refund_tx,
		"swapId":tmpthis.swapId
	}	 

	tmpthis.swapLib.broadcastTx(params,
	
	function successCallback(txid,swapId){
    	 
    	 tmpthis.dataService.currentSwaps[swapId].status = "r3"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error,swapId){ 
    	 tmpthis.dataService.currentSwaps[swapId].status = "errorBR"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    	 
    });

  }
  checkClaimConfirmation(){ 

var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];
 
  	this.swapLib.checkClaimConfirmation(theSwap.their_transaction,theSwap.claim_tx,theSwap.their_address,
    function successCallback(confirmation){
    	console.log("conf "+confirmation);
    	if(confirmation > tmpthis.dataService.CONFIRMATIONS_NUM - 1){

    		tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "9";
    	 
    		tmpthis.dataService.saveCurrentSwaps();
 
    		return;

    	}else{
    			setTimeout(function(){ tmpthis.checkClaimConfirmation()}, 10000);

    	}
    	
    	 

    },
    function errorCallback(error){
  	setTimeout(function(){ tmpthis.checkClaimConfirmation()}, 10000);

    	 
    	 
    }); 

 

  }

    checkRefundConfirmation(){ 

    var tmpthis = this;
  	var theSwap = tmpthis.dataService.currentSwaps[tmpthis.swapId];
 
  	this.swapLib.checkRefundConfirmation(theSwap.redeem_script.transaction,theSwap.refund_tx,theSwap.my_address,
    function successCallback(confirmation){
    	console.log("conf "+confirmation);
    	if(confirmation > tmpthis.dataService.CONFIRMATIONS_NUM - 1){

    		tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "r4";
    	 
    		tmpthis.dataService.saveCurrentSwaps();
 
    		return;

    	}else{
    			setTimeout(function(){ tmpthis.checkRefundConfirmation()}, 10000);

    	}
    	
    	 

    },
    function errorCallback(error){
  	setTimeout(function(){ tmpthis.checkRefundConfirmation()}, 10000);

    	 
    	 
    }); 

 

  }
  showSwapSpinner(){
   
  	  
  var aSwap = this.dataService.currentSwaps[this.swapId];
  	if(aSwap.status != "error" && aSwap.status != "9" && aSwap.status != "r4"){
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

   searchForSecret(){
  	 
var tmpthis = this;
  	var aSwap = this.dataService.currentSwaps[tmpthis.swapId];
    	var params = {  
    		"hex":aSwap.redeem_script.transaction,
    		"my_address":aSwap.my_address,
    		"their_address":aSwap.their_address,
    		"secret_hash":aSwap.redeem_script.secret_hash, 
    	}

  	this.swapLib.searchForSecret(params,
    
    function successCallback(secret){

    	if(secret != null){
    	console.log("the secret "+secret.toString('hex'));

    	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "6a";
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].redeem_script["secret"] = secret.toString('hex');
  		tmpthis.dataService.saveCurrentSwaps();

  		tmpthis.claimToken();
  		}else{

    	 setTimeout(function(){tmpthis.searchForSecret()},10000);
    	}

    },
    function errorCallback(error,swapId){
    	console.log("swid"+swapId);
    	alert(error);
     	tmpthis.dataService.currentSwaps[swapId].status = "errorS";
  		tmpthis.dataService.saveCurrentSwaps();
  		setTimeout(function(){tmpthis.searchForSecret()},10000);
    });

  }

  saveTheirTransaction(hex){ 
	this.dataService.currentSwaps[this.swapId].their_transaction = hex;
	this.dataService.saveCurrentSwaps();
}
 startWait(data){
  	this.dataService.currentSwaps[this.swapId].status = "b1";
  	this.dataService.saveCurrentSwaps();
  }
  startSwap(data){
  	
  	this.dataService.currentSwaps[this.swapId].their_address = data.data.address;
  	this.dataService.currentSwaps[this.swapId].status = "a1";
  	this.dataService.currentSwaps[this.swapId].leader = true;
    this.dataService.saveCurrentSwaps();

  	var tmpthis = this;
     console.log("here went");
     var params = {
     	"leader":this.dataService.currentSwaps[this.swapId].leader,
     	"userPrivKey":this.dataService.userWif,
     	"alicesAddress":this.dataService.userAddress,
     	"bobsAddress":data.data.address,
     	"sendToken":data.data.get_token,
     	"sendAmount":data.data.get_amount,
     	"userSecretSeedMnemonic":this.dataService.userSecretSeedMnemonic,
     	"currentPathIndex":this.dataService.getLastSecretIndex()
     };

    this.swapLib.createSwapTransaction(params,
    
    function successCallback(hex,scriptHex,secret,secretHash){
    	console.log("alice hex "+hex);
    	console.log("secret "+secret);
    	console.log("secretHash "+secretHash);

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
    		"swapId":tmpthis.swapId
    	}
    	tmpthis.addToRedeemScripts(params);

    	tmpthis.dataService.peerLib.continueSwap(tmpthis.swapId,secretHash,tmpthis.dataService.userAddress,hex);
		 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "a2";

		tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error){
    	 
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "error";
    	tmpthis.dataService.saveCurrentSwaps();

    	alert(error);
    });

  }

   makeSwap(secretHash,data){ 
  	var aSwap = this.dataService.currentSwaps[this.swapId];
    aSwap.status = "b2";
  	aSwap.their_address = data.address;
  	aSwap.leader = false;
  	this.dataService.saveCurrentSwaps();
  	var tmpthis = this;
     console.log("making cont");
     var params = {
     	"leader":aSwap.leader,
     	"swapId":this.swapId,
     	"userPrivKey":this.dataService.userWif,
     	"alicesAddress":this.dataService.userAddress,
     	"bobsAddress":data.address,
     	"sendToken":data.get_token,
     	"sendAmount":data.get_amount,
     	"userSecretSeedMnemonic":this.dataService.userSecretSeedMnemonic,
     	"currentPathIndex":this.dataService.getLastSecretIndex(),
     	"secretHash":secretHash
     };

    this.swapLib.createSwapTransaction(params,
    
    function successCallback(hex,scriptHex,secret,secretHash){

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
    		"swapId":tmpthis.swapId
    	}
    	tmpthis.addToRedeemScripts(params);

    	console.log("bob hex "+hex);
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "b3"; 
    	tmpthis.dataService.saveCurrentSwaps();
    	tmpthis.dataService.peerLib.sendHex(tmpthis.swapId,tmpthis.dataService.userAddress,hex);

    	tmpthis.broadcastBobs();
		 
    },
    function errorCallback(error){
    	console.log("error "+error);
    	alert(error);
    });
  }

   addToRedeemScripts(params){
 	

     
    	var redeemScript = {
    		"secret":params.secret,
    		"secret_hash":params.secretHash,
    		"transaction":params.hex,
    		"script":params.script
    	}
    	this.dataService.currentSwaps[this.swapId].redeem_script = redeemScript;

    	this.dataService.saveCurrentSwaps();
 }

 broadcastBobs(){

	var tmpthis = this;
 
	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "4";
	var hex = tmpthis.dataService.currentSwaps[tmpthis.swapId].their_transaction;
	tmpthis.dataService.saveCurrentSwaps(); 
	var params = {
		"hex":hex,
		"swapId":tmpthis.swapId
	}

	this.swapLib.broadcastTx(params,
	
	function successCallback(txid){
    	 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "5"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error){
   
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorB1"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    	 
    });

}
 claimToken(){


  	var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];

  	var secret = theSwap.redeem_script.secret;
  	if(typeof secret == "undefined"){
  		//is bob so need to wait for alice
  		//call check for secret;
  		return;

  	} 
  	console.log(theSwap);
  	 
  	var params = {
  		"leader":theSwap.leader, 
  		"hex":theSwap.their_transaction, 
  		"user_wif":this.dataService.userWif,
  		"secret":secret,
  		"my_address":theSwap.my_address,
  		"their_address":theSwap.their_address,
  		"get_token":theSwap.get_token,
  		"get_amount":theSwap.get_amount,
  	}
 
  	this.swapLib.claimToken(params,
    function successCallback(signedTx){
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "7";
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].claim_tx = signedTx;
    	tmpthis.dataService.saveCurrentSwaps();



	    tmpthis.broadcastClaim();

    	
    	 

    },
    function errorCallback(error){
    	if(typeof tmpthis.dataService.currentSwaps[tmpthis.swapId].claim_tx != "undefined"){
    		 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "7";
    		  tmpthis.broadcastClaim();
    	}
    	else{
    	  tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorCT";
    	}
    	 
    	tmpthis.dataService.saveCurrentSwaps();

    	alert("1"+error);
    	 
    });
   

  }

  broadcastClaim(){

  	var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];
    	
    	var params = {
		"hex":theSwap.claim_tx,
		"swapId":tmpthis.swapId
	}	 

	tmpthis.swapLib.broadcastTx(params,
	
	function successCallback(txid,swapId){
    	 
    	 tmpthis.dataService.currentSwaps[swapId].status = "8"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error,swapId){ 
    	 tmpthis.dataService.currentSwaps[swapId].status = "errorBC"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    	 
    });

  }

 

 


 checkForConfirmation(){
var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[this.swapId];
 	theSwap.status = "5";
    	tmpthis.dataService.saveCurrentSwaps();
   	tmpthis.swapLib.checkConfirmation(theSwap.redeem_script.transaction,theSwap.their_address ,theSwap.my_address,
    function successCallback(confirmation){
    	
    	if(confirmation > tmpthis.dataService.CONFIRMATIONS_NUM - 1){

    		console.log("confirmations "+confirmation + " "+(tmpthis.dataService.CONFIRMATIONS_NUM - 1));
    		try{
    		var theSwap = tmpthis.dataService.currentSwaps[tmpthis.swapId];
    		var secret = theSwap.redeem_script.secret;
    	}
    	catch(e){
    		alert(e);
    	}

  			if(typeof secret == "undefined"){
  				//is bob so need to wait for secret from alices claim
    			tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "6b";
    		}else{
    			//is alice so canclaim with secret

    			tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "6a";
    		}
    		tmpthis.dataService.saveCurrentSwaps();

    		tmpthis.claimToken();
    		return;

    	}else{
    		tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "5";
    	tmpthis.dataService.saveCurrentSwaps();
    		 setTimeout( function(){tmpthis.checkForConfirmation()}, 10000);
    	}
    	
    	 

    },
    function errorCallback(error){
    	//alert("2"+error);
    	 	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorC";
    	tmpthis.dataService.saveCurrentSwaps();
    	 setTimeout( function(){tmpthis.checkForConfirmation()}, 10000);
    	 
    	 
    });


  }

    removeSwap(){

 
  		 delete this.dataService.currentSwaps[this.swapId];
	 
  		 this.dataService.saveCurrentSwaps(); 
  }

   isLeader(){
  	var theSwap = this.dataService.currentSwaps[this.swapId];
  	return theSwap.leader;
  }


    getRefundStatus(){
  	var aSwap = this.dataService.currentSwaps[this.swapId];
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

}
