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
        			
        			if(aSwap.refund_status == "r2"){
        				 this.broadcastRefund();

        			}
        			else if(aSwap.refund_status == "r3" && aSwap.status != "9"){
        				  this.checkRefundConfirmation();

        			}

        			if(typeof aSwap.redeem_script != "undefined" && typeof aSwap.redeem_script.transaction != "undefined" && aSwap.status != "9"  && aSwap.refund_status != "r2" && aSwap.refund_status != "r3" && aSwap.refund_status != "r4"){
        				this.checkRefund();
        			}
        			
        			
  		
  				 
			}
  }
  showInfo(){
  	var theSwap = this.dataService.currentSwaps[this.swapId];
  	console.log(theSwap);
  }
  checkRefund(){
console.log("checking refund...");
  	var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];
  
  	var params = { 
  		"redeem_script":theSwap.redeem_script.script,
  		"hex":theSwap.redeem_script.transaction,  
  		"my_address":theSwap.my_address, 
  		"leader":theSwap.leader
  	}



  this.swapLib.checkRefund(params,
    function successCallback(timeTillRefund,confirmed){

    	theSwap.redeem_script.time_till_refund = timeTillRefund;
    		tmpthis.dataService.saveCurrentSwaps();

    if(confirmed && typeof theSwap.refund_status == "undefined" ){
 		    theSwap.refund_status = "r0";
  	 	tmpthis.dataService.saveCurrentSwaps();		
 	}

    if(theSwap.redeem_script.time_till_refund == 0){
	 
	    theSwap.refund_status = "r1";
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
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_status = "r2";
    	tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_tx = signedTx;
    	tmpthis.dataService.saveCurrentSwaps();
 
	    tmpthis.broadcastRefund();
 
    },
    function errorCallback(error){
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_status = "errorCR";
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
	
	function successCallback(txid){
    	 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_status = "r3"; 
    	  tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_txid = txid;
    	 tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error){ 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_status = "errorBR"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    	 
    });

  }
  checkClaimConfirmation(){ 

var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[tmpthis.swapId];
 
  	this.swapLib.checkClaimConfirmation(theSwap.claim_tx,
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
 
  	this.swapLib.checkRefundConfirmation(theSwap.refund_tx,
    function successCallback(confirmation){
    	console.log("conf "+confirmation);
    	if(confirmation > tmpthis.dataService.CONFIRMATIONS_NUM - 1){

    		tmpthis.dataService.currentSwaps[tmpthis.swapId].refund_status = "r4";
    	 
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
  	if(aSwap.status != "error" && aSwap.status != "9" && aSwap.refund_status != "r4"){
  		return true;
  	}
  	return false;
  }

  getStatus(){
  	
  	var aSwap = this.dataService.currentSwaps[this.swapId];
   	var status = aSwap.status;

  	if(status == "a0"){
  		return "waiting for match...";
  	}
  	else if(status == "a1"){
  		return "creating transaction";
  	}
  	else if(status == "b1"){
  		return "waiting for other party";
  	}
  	else if(status == "a2"){
  		return "waiting for other party";
  	}
  	else if(status == "b2"){
  		return "creating transaction";
  	}
  	else if(status == "a3"){
  		return "checking transaction";
  	}
  	else if(status == "b3"){
  		return "checking transaction";
  	}
  	else if(status == "4"){
  		return "broadcasting...";
  	}
  	else if(status == "5"){
  		return "waiting for confirmation...";
  	}
  	else if(status == "6a"){
  		return "claiming token...";
  	}
  	else if(status == "6b"){
  		return "waiting for other party to reveal secret";
  	}
  	else if(status == "7"){
  		return "broadcasting claim...";
  	}
  	else if(status == "8"){
  		return "waiting for claim confirmation....";
  	}
  	else if(status == "9"){
  		return "Swap complete!";
  	} 
  	else if(status == "error"){
  		return "error creating transaction";
  	}
  	else if(status == "errorB1"){
  		return "error broadcasting";
  	}
  	else if(status == "errorC"){
  		return "error checking confirmations";
  	}
  	else if(status == "errorS"){
  		return "error searching secret";
  	}
  	else if(status == "errorCT"){
  		return "error creating claim transaction";
  	}
  	else if(status == "errorBC"){
  		return "error broadcasting claim";
  	}


  }
  getRefundStatus(){
  	
  	var aSwap = this.dataService.currentSwaps[this.swapId];
   	var status = aSwap.status;
  	var refund_status = aSwap.refund_status;

  	var showTimeTillRefund = true;

  	if(status == "9"){
  		return "";
  	}

  	if(refund_status == "errorCR"){
  		return "error creating refund transaction, trying again...";
  	}
  	else if(refund_status == "errorBR"){
  		return "error broadcasting refund transaction, trying again...";
  	}
  	else if(refund_status == "r1"){
  		return "creating refund transaction, trying again...";
  	}
  	else if(refund_status == "r2"){
  		return "broadcasting refund transaction...";
  	}
  	else if(refund_status == "r3"){
  		return "waiting for refund confirmation...";
  	}
  	else if(refund_status == "r4"){
  		return "refund complete!";
  	}
  	else if(refund_status == "r0"){

  		showTimeTillRefund = true;
  		 
  	}
  	else{
  		showTimeTillRefund = false;
  		 
  	}

  	if(showTimeTillRefund){
  		
  	var redeemScript = aSwap.redeem_script;
  	if(typeof redeemScript != "undefined"){
  	var timeTillRefund = redeemScript.time_till_refund;

   if(typeof  timeTillRefund != "undefined"){
  	if(typeof  timeTillRefund != "undefined"){
  		if( timeTillRefund == 0){
  			return "";
  		}
  	}
  }
   }
    
  		return "Refund in (approx): "+this.getFormattedTime(timeTillRefund);
  	}



  }

   searchForSecret(){
  	
var tmpthis = this;
  	var aSwap = this.dataService.currentSwaps[tmpthis.swapId];

    	var params = {  
    		"script_address":aSwap.redeem_script.script_address, 
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
    function errorCallback(error){ 
    	console.error(error);
     	tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorS";
  		tmpthis.dataService.saveCurrentSwaps();
  		setTimeout(function(){tmpthis.searchForSecret()},10000);
    });

  }

  saveTheirTransaction(hex){ 
	this.dataService.currentSwaps[this.swapId].their_transaction = hex;
	this.dataService.saveCurrentSwaps();
}
 startWait(){
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
    
    function successCallback(hex,scriptHex,secret,secretHash,scriptAddress,theirScriptAddress){
    	console.log("alice hex "+hex);
    	console.log("secret "+secret);
    	console.log("secretHash "+secretHash);

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
    		"swapId":tmpthis.swapId,
    		"address":scriptAddress,
    		"their_address":theirScriptAddress
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
    
    function successCallback(hex,scriptHex,secret,secretHash,scriptAddress,theirScriptAddress){

    	var params = {
    		"secret":secret,
    		"secretHash":secretHash,
    		"hex":hex,
    		"script":scriptHex,
    		"swapId":tmpthis.swapId,
    		"address":scriptAddress,
    		"theirAddress":theirScriptAddress
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
    		"script":params.script,
    		"script_address":params.address
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
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].their_txid = txid;
    	 tmpthis.dataService.saveCurrentSwaps();
    	 tmpthis.checkForConfirmation();

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
	
	function successCallback(txid){
    	 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "8"; 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].claim_txid = txid;
    	 tmpthis.dataService.saveCurrentSwaps();

    },
    function errorCallback(error){ 
    	 tmpthis.dataService.currentSwaps[tmpthis.swapId].status = "errorBC"; 
    	 tmpthis.dataService.saveCurrentSwaps();

    	 
    });

  }




 checkForConfirmation(){
var tmpthis = this;
  	var theSwap = this.dataService.currentSwaps[this.swapId];
 	theSwap.status = "5";
    	tmpthis.dataService.saveCurrentSwaps();

   	tmpthis.swapLib.checkConfirmation(theSwap.redeem_script.transaction,
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
 getFormattedTime(timestamp) {

    
    
  
  var minutes = Math.floor( (timestamp/1000/60) % 60 );
  var hours = Math.floor( (timestamp/(1000*60*60)) % 24 );
  var days = Math.floor( timestamp/(1000*60*60*24) );
   var str = "";
  if(days > 0){
  	  str += days+" days";
  }
  if ( hours > 0){
     str += " "+hours+" hrs";
  }
  if ( minutes > 0){
   str +=  " "+minutes+" mins";
  }
  
   return str;

}

    

}
