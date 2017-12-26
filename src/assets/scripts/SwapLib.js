var SwapLib = function() {

 var huburl = "https://52.243.37.50:15000/api/";
    var counterpartyurl = "http://52.243.37.50:14000/api/";
    var counterpartyUsername = "rpc";
    var counterpartyPassword = "u3Hde3Loib5HjDq1SdehBKiSSAlq";
    var auth = window.btoa(counterpartyUsername + ":" + counterpartyPassword);
	  

 var bitcoin = tools.bitcoin;
 NETWORK = bitcoin.networks.testnet;
 LOCKTIME = 1;
 SECRET_ROOT_PATH = "m/67'/0/0"
 function SwapLib() {

 }
 
function convertDaysIntoCSVTime(days){

	var secondsInDays = 86400;
	var totalSeconds = secondsInDays * days;
	return Math.round(totalSeconds / 512);
}
function scriptHashOutput(hash) {
 
  return bitcoin.script.compile([
    bitcoin.opcodes.OP_HASH160,
    hash,
    bitcoin.opcodes.OP_EQUAL
  ])
}
 
SwapLib.prototype.generateP2WSHWallet = function (){
 
    var keyPair = bitcoin.ECPair.makeRandom();

    var pubKey = keyPair.getPublicKeyBuffer()

    var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey))
    var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
    var address = bitcoin.address.fromOutputScript(scriptPubKey,NETWORK)

    console.log(keyPair.toWIF());
    console.log(address);

 
		
}
SwapLib.prototype.generateSecretSeedMnemonic = function (alicesAddress,bobsAddress,sendToken,sendAmount,userSecretSeed){

	return tools.bip39.generateMnemonic();

}

SwapLib.prototype.createSwapTransaction = function (alicesAddress,bobsAddress,sendToken,sendAmount,userSecretSeedMnemonic,currentPathIndex,callback,error){


  var userSecretSeed = tools.bip39.mnemonicToSeedHex(userSecretSeedMnemonic);
 
  var root = bitcoin.HDNode.fromSeedHex(userSecretSeed);
  var path = SECRET_ROOT_PATH+"/"+currentPathIndex;
  var child = root.derivePath(path)
  var secret = child.getPublicKeyBuffer();
  var secretHash = bitcoin.crypto.hash160(secret);

 aliceToBobRedeemScript =  bitcoin.script.compile([,
    bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      secretHash,
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      bobsAddress,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(convertDaysIntoCSVTime(LOCKTIME)),
      bitcoin.opcodes.OP_NOP3,
      bitcoin.opcodes.OP_DROP, 
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      alicesAddress,
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG
 ]);

 var aliceToBobOutputScript =   scriptHashOutput(bitcoin.crypto.hash160(aliceToBobRedeemScript));
 var aliceToBobP2SHAddress =  bitcoin.address.fromOutputScript(aliceToBobOutputScript, NETWORK);
 console.log(alicesAddress+" "+sendToken+" "+aliceToBobP2SHAddress+" "+sendAmount);
 
createSendRequest(alicesAddress,sendToken,aliceToBobP2SHAddress,sendAmount).then(function(unsignedHex) {
	  console.log('alice to aliceToBobP2SHAddress unsignedHex; ', unsignedHex);

      var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex);
      unsignedTx.version = 2;		
      unsignedTx .ins.forEach(function (input, idx) {
       input["sequence"]=4294967293;  
      });

      var txb = bitcoin.TransactionBuilder.fromTransaction(unsignedTx, NETWORK);

	  txb.inputs.forEach(function (input, idx) {
                                        	  
        txb.inputs[idx] = {}; // small hack to undo the fact that CP sets the output script in the input script
                                             
        txb.sign(idx, userPrivKey);
                                               
      });

                                        
      var signedTx = txb.build();
     
	  callback(signedTx.toHex(),secret.toString("hex"));

}) .catch(function(err) {
       error(err);
    })    

  

    		
}


var createSendRequest = function(source,token,destination,quantity){
	var params = {
		"source":source,
		"asset":token,
		"destination":destination,
		"quantity":quantity*100000000,
		"use_enhanced_send":true
	}
		 return new Promise(function(resolve, reject) {
     	makePostRequest("/transactions/send", params,

		function callback(result){
				resolve(JSON.parse(result));

		},
		function error(error){
    		resolve(error);

		},


		);
    })
 
		 

	}


	 function makePostRequest(endpoint,params,callback,error){

	 	 var json = JSON.stringify({
                jsonrpc: "2.0",
                id: 0,
                method: "create_send",
                params: params

            });

		var xhr = new XMLHttpRequest();
	

		if(NETWORK == bitcoin.networks.testnet){
			xhr.open("POST", counterpartyurl, true);
			//xhr.open("POST", "https://apitestnet.indiesquare.me/v2"+endpoint, true);
		}
		else{
			xhr.open("POST", "https://api.indiesquare.me/v2"+endpoint, true);
		}
		
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("Authorization", "Basic " + auth);
		xhr.onload = function (e) {
  		
  		if (xhr.readyState === 4) {

  		  if (xhr.status === 200) {

    		 callback(xhr.responseText);

    		} else {
	console.log("here2 "+xhr.responseText);
    	  error(xhr.responseText);

    		}
  		}
};
xhr.onerror = function (e) {
	console.log("here "+e);
 error(e);
};
console.log(json);
xhr.send(json); 
    }


	 

 return SwapLib;
}();