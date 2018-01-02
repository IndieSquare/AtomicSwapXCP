var SwapLib = function() {

    var huburl = "https://52.243.37.50:15000/api/";
   
    var counterpartyUrl = "http://52.243.37.50:14000/api/";
    var counterpartyUsername = "rpc";
    var counterpartyPassword = "u3Hde3Loib5HjDq1SdehBKiSSAlq";
    var counterpartyAuth = window.btoa(counterpartyUsername + ":" + counterpartyPassword);


    var bitcoindUrl = "http://52.243.37.50:18332";
    var bitcoindUsername = "btcd-rpc";
    var bitcoindPassword = "ruwoh7kae1feiz3Rai8t";
    var bitcoindAuth = window.btoa(bitcoindUsername + ":" + bitcoindPassword);
 
 var bitcoin = tools.bitcoin;
 NETWORK = bitcoin.networks.testnet;
 LOCKTIME = 1;
 SECRET_ROOT_PATH = "m/67'/0/0"
 REGULAR_DUST_SIZE = 5430;
 CLAIM_FEE = 10000;
 SEGWIT = false;
 
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

SwapLib.prototype.verifyHex = function (hex){
	return true;
}

SwapLib.prototype.getAddress = function (wif){

	 var keyPair = bitcoin.ECPair.fromWIF(wif,NETWORK);

    var pubKey = keyPair.getPublicKeyBuffer()
   if(SEGWIT){
var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey))
    var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
    return bitcoin.address.fromOutputScript(scriptPubKey,NETWORK)

   }else{
   	return keyPair.getAddress();
   }
    
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
function encode (payload, version) {
  if (Array.isArray(payload) || payload instanceof Uint8Array) {
    payload = new tools.buffer(payload)
  }

  var buf
  if (version != null) {
    if (typeof version === 'number') {
      version =  new tools.buffer([version])
    }
    buf = tools.buffer.concat([version, payload])
  } else {
    buf = payload
  }

  var checksum = bitcoin.crypto.sha256(bitcoin.crypto.sha256(buf)).slice(0, 4)
  var result =  tools.buffer.concat([buf, checksum])
  return tools.base58.encode(result)
}
SwapLib.prototype.convertHashToTestnetWif = function(){
	var pbuf = tools.buffer("50D1BFCA6A232B8493C983057B7DCE9AEA3A0070841C1AFD012D76C56EB0D43F"+"01","hex");
	var version = 0xEF; //Bitcoin private key

	 
  console.log(encode(pbuf,version));
	 
 
  throw "2";
}


function getScriptAddressFromHex(hex,theirAddress){

	var tx = bitcoin.Transaction.fromHex(hex);
	console.log("tx "+tx+ "their address"+theirAddress);

	var scriptAddress = null;
	tx.outs.forEach(function (output, idx) {
          
      	 
      			var type = bitcoin.script.classifyOutput(output.script);
      			console.log("type:"+type);
      			if(type == "scripthash"){

      				var chunks = bitcoin.script.decompile(output.script);
      				  chunks .forEach(function (chunk) {
      				  	//console.log(chunk);
      				  	try{
      				  	var hash = chunk.toString('hex');

 							try{
   										 var add =  bitcoin.address.fromOutputScript(scriptHashOutput(chunk), NETWORK);

   										 if(add != theirAddress){
   										 	 scriptAddress = add;
   										  
   										 }
 										
   }
      				  catch(e){
							console.log(e);
      				  }



      				  }
      				  catch(e){

      				  }


 

      				  });

      			}

      
      });

	return scriptAddress;

}

          var signClaimTxWithSecret = function(txb, privKey, redeemScript, secret) {
                                        	 
                    var signatureScript = redeemScript;

                    var signatureHash = txb.tx.hashForSignature(0, signatureScript, bitcoin.Transaction.SIGHASH_ALL);
                    var signature = privKey.sign(signatureHash);

                    var tx = txb.buildIncomplete();

                    var scriptSig = bitcoin.script.compile([
                        signature.toScriptSignature(bitcoin.Transaction.SIGHASH_ALL),
                        secret, 
                         bitcoin.opcodes.OP_TRUE,
                        redeemScript
                    ]);
 
                   
                    tx.setInputScript(0, scriptSig);

                    return tx;
                };



SwapLib.prototype.claimToken = function (params,mainCallback,mainError){

console.log("claimToken "+JSON.stringify(params));
 
var secret = tools.buffer(params.secret,'hex');
var keyPair = bitcoin.ECPair.fromWIF(params.user_wif,NETWORK);
var secretHash = bitcoin.crypto.hash160(secret);
var theirPubKey = tools.bitcoin.address.fromBase58Check(params.their_address).hash;
var myPubKey = tools.bitcoin.address.fromBase58Check(params.my_address).hash;
 
 var aliceToBobRedeemScript = createRedeemScript(secretHash,theirPubKey,myPubKey);
 
 if(SEGWIT){

var aliceToBobRedeemScript = bitcoin.script.witnessScriptHash.output.encode(bitcoin.crypto.sha256(aliceToBobRedeemScript))
 

}
 
var aliceToBobOutputScript =   scriptHashOutput(bitcoin.crypto.hash160(aliceToBobRedeemScript));

var aliceToBobP2SHAddress =  bitcoin.address.fromOutputScript(aliceToBobOutputScript, NETWORK);

var aliceToBobP2SHAddressCheck = getScriptAddressFromHex(params.hex,params.their_address);
 

 


if(aliceToBobP2SHAddress != aliceToBobP2SHAddressCheck){
	mainError("scripts dont match");
	return;
}
 
var sendParams = {
	"address":aliceToBobP2SHAddress,
	"unconfirmed":true
	}

 
counterpartyCall("get_unspent_txouts",sendParams).then(function(result) {
	
	var currentUTXOS = result.result;

	if(params.get_token == "BTC"){
		sendParams = {
			"source":aliceToBobP2SHAddress,
			"asset":params.get_token,
			"destination":params.my_address,
			"quantity":params.get_amount,
			"fee":CLAIM_FEE 
		}
	}else{
		sendParams = {
			"source":aliceToBobP2SHAddress,
			"asset":params.get_token,
			"destination":params.my_address,
			"quantity":params.get_amount,
			"use_enhanced_send":true,
			"fee":CLAIM_FEE
		}
	}

	counterpartyCall("create_send",sendParams).then(function(unsignedHex) {

	console.log('alice claim token from bob', unsignedHex.result);
 
   var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex.result);

      unsignedTx.version = 2;	 
      unsignedTx.ins.forEach(function (input, idx) {
          
      		input["sequence"]=4294967293;   
 
      
      });

   	
      var txb = bitcoin.TransactionBuilder.fromTransaction(unsignedTx, NETWORK);
 
	  
 
	   var signatureHash = txb.tx.hashForSignature(0, aliceToBobRedeemScript, bitcoin.Transaction.SIGHASH_ALL);
       var signature = keyPair.sign(signatureHash);

       var tx = txb.buildIncomplete();

       var scriptSig = bitcoin.script.compile([
                       signature.toScriptSignature(bitcoin.Transaction.SIGHASH_ALL),
                       keyPair.getPublicKeyBuffer(),
                       secret, 
                       bitcoin.opcodes.OP_TRUE,
                       aliceToBobRedeemScript
        ]);
 
                   
        tx.setInputScript(0, scriptSig);
        
        var signedTx = tx.toHex();

		mainCallback(signedTx); 

}) .catch(function(err) {
       mainError(err,params.swap_id);
    })   
 


}) .catch(function(err) {
      mainError(err,params.swap_id);
    }) 

 
  


};

SwapLib.prototype.searchForSecret = function (params,callback,error){
	var hex = params.hex;
	var myAddress = params.my_address;

	 var scriptAddress = getScriptAddressFromHex(hex,myAddress);
	  console.log("scriptAddress:"+scriptAddress);
	 var tx = bitcoin.Transaction.fromHex(hex);
	   var txid = tx.getId();
	   console.log("txid"+txid);

	 if(scriptAddress == null){
	 	mainError("error");
	 	return;
	 }
	
var sendParams = {
		"address":scriptAddress,
		"unconfirmed":true
	}

counterpartyCall("search_raw_transactions",sendParams).then(function(result) {
 
 
 for(key in result.result){
console.log("Res 1");
 	var aTx = result.result[key];
 	
 	var tx = bitcoin.Transaction.fromHex(aTx.hex);
    
 	tx.outs.forEach(function (output, idx) {
          
     var type = bitcoin.script.classifyOutput(output.script);
     
     console.log(type);
     
     if(type == "pubkeyhash"){
     	
     	var address = bitcoin.address.fromOutputScript(output.script, NETWORK);
        
        console.log(address+ " "+params.their_address);
      	
      	if(address == params.their_address){
      		
      		 console.log(tx);
      		 	tx.ins.forEach(function (input, idx) {
      		 		try{
      		 			callback(bitcoin.script.toStack(input.script)[2]);
      		 			return;
      		 		}
      		 		catch(e){
      		 			error(e);
      		 			return;
      		 		}
      		 	});
          
      		 throw "e";

      	}

     }
    
    });

 }

  
 callback(0);
 	return;

}) .catch(function(err) {
   error(err);
    })
	 
		
 


};

SwapLib.prototype.checkConfirmation = function (hex,theirAddress,callback,error){

	 
	 var scriptAddress = getScriptAddressFromHex(hex,theirAddress);
	  console.log("scriptAddress:"+scriptAddress);
	 var tx = bitcoin.Transaction.fromHex(hex);
	   var txid = tx.getId();

	 if(scriptAddress == null){
	 	mainError("error");
	 	return;
	 }
	
var sendParams = {
		"address":scriptAddress,
		"unconfirmed":true
	}

counterpartyCall("get_unspent_txouts",sendParams).then(function(result) {
console.log("result");
 console.log(result);

 for(key in result.result){
 	var aUTXO = result.result[key];
 	console.log("autcon" + JSON.stringify(aUTXO));
 	if(aUTXO.txid == txid){

 		callback(aUTXO.confirmations);
 		 return;
 	}
 }
 callback(0);
 	return;

}) .catch(function(err) {
   error(err);
    })
	 
		
 


};


SwapLib.prototype.broadcastTx = function (params,mainCallback,mainError){
		
			var tx = bitcoin.Transaction.fromHex(params.hex);
		 var txid = tx.getId();
	 
 var sendParams = {
		"tx_hash":txid, 
	}

counterpartyCall("getrawtransaction",sendParams).then(function(result) {

if(typeof result.result != "undefined"){
	mainCallback(txid,params.swapId); //it was broadcast somehow
}
else{
broadcastTransaction(params.hex,
			function callback(result){
			result = JSON.parse(result);
			console.log(result);
			mainCallback(result,params.swapId);

				 

		},
		function error(error){
    		mainError(error,params.swapId);

		});

}

}) .catch(function(err) {
       broadcastTransaction(params.hex,
			function callback(result){
			result = JSON.parse(result);
			console.log(result);
			mainCallback(result,params.swapId);

				 

		},
		function error(error){
    		mainError(error,params.swapId);

		});
    })
	 
		
 

}

function createRedeemScript(secretHash,alicePubKey,bobPubKey){
	var aliceToBobRedeemScript =  bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      secretHash,
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      bobPubKey,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(convertDaysIntoCSVTime(LOCKTIME)),
      bitcoin.opcodes.OP_NOP3,
      bitcoin.opcodes.OP_DROP, 
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      alicePubKey,
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG
 ]);

	return aliceToBobRedeemScript;
}

SwapLib.prototype.createSwapTransaction = function (params,callback,error){

 console.log("swapStart "+params.bobsAddress+" "+params.sendToken+" "+params.sendAmount);

  var keyPair = bitcoin.ECPair.fromWIF(params.userPrivKey,NETWORK);
 

  if(typeof params.secretHash == "undefined"){

  	console.log("generate secret:"+params.secretHash);
  	var userSecretSeed = tools.bip39.mnemonicToSeedHex(params.userSecretSeedMnemonic);
 
  	var root = bitcoin.HDNode.fromSeedHex(userSecretSeed);
  	var path = SECRET_ROOT_PATH+"/"+params.currentPathIndex;
  	var child = root.derivePath(path)
  	var secret = child.getPublicKeyBuffer();

  	secretHash = bitcoin.crypto.hash160(secret);

  }
  else{
  	secretHash = tools.buffer(params.secretHash,'hex');
  }


var alicePubKey = tools.bitcoin.address.fromBase58Check(params.alicesAddress).hash;
var bobPubKey = tools.bitcoin.address.fromBase58Check(params.bobsAddress).hash;
  var aliceToBobRedeemScript = createRedeemScript(secretHash,alicePubKey,bobPubKey);
 if(SEGWIT){

 
var aliceToBobRedeemScript = bitcoin.script.witnessScriptHash.output.encode(bitcoin.crypto.sha256(aliceToBobRedeemScript))

 

}


var aliceToBobOutputScript =   scriptHashOutput(bitcoin.crypto.hash160(aliceToBobRedeemScript));

 var aliceToBobP2SHAddress =  bitcoin.address.fromOutputScript(aliceToBobOutputScript, NETWORK);
 console.log(params.alicesAddress+" "+params.sendToken+" "+aliceToBobP2SHAddress+" "+params.sendAmount);


 var sendParams = {
		"address":params.alicesAddress,
		"unconfirmed":true
	}

 
counterpartyCall("get_unspent_txouts",sendParams).then(function(result) {
	
	var currentUTXOS = result.result;

	if(params.sendToken == "BTC"){
		sendParams = {
			"source":params.alicesAddress,
			"asset":params.sendToken,
			"destination":aliceToBobP2SHAddress,
			"quantity":params.sendAmount+CLAIM_FEE, 
		}
	}else{
		sendParams = {
			"source":params.alicesAddress,
			"asset":params.sendToken,
			"destination":aliceToBobP2SHAddress,
			"quantity":params.sendAmount,
			"use_enhanced_send":false,
			"regular_dust_size":CLAIM_FEE
		}
	}

	counterpartyCall("create_send",sendParams).then(function(unsignedHex) {

	  console.log('alice to aliceToBobP2SHAddress unsignedHex; ', unsignedHex.result);
   var unsignedTx = bitcoin.Transaction.fromHex(unsignedHex.result);


 
    
      unsignedTx.version = 2;

      if(SEGWIT){		
  	  var inputs = [];
      unsignedTx.ins.forEach(function (input, idx) {
          
      		input["sequence"]=4294967293;  
      		inputs.push(input);
 
      });
  		}

   		
      var txb = bitcoin.TransactionBuilder.fromTransaction(unsignedTx, NETWORK);

	  txb.inputs.forEach(function (input, idx) {
                                     	  
       txb.inputs[idx] = {}; // small hack to undo the fact that CP sets the output script in the input script
       
        if(SEGWIT){
        var pubKey = keyPair.getPublicKeyBuffer()
    	var pubKeyHash = bitcoin.crypto.hash160(pubKey)

    	var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash)
        var outputValue = getUnspentForInput(inputs,idx);
       
        console.log(redeemScript.toString('hex'));
        console.log(outputValue);
 
 		 
       		txb.sign(idx, keyPair,redeemScript , null, outputValue)
   		}
   		else{
   			console.log("sign normal")
   			 txb.sign(idx, keyPair)
   		}

                                       
      });
                            
       var signedTx = txb.build();
       console.log(signedTx.toHex());

       if(typeof secret != "undefined"){
      		var secretString = secret.toString("hex");
  		}
  		if(typeof secretHash != "undefined"){
      		var secretHashString = secretHash.toString("hex");
  		}
	  callback(signedTx.toHex(),secretString,secretHashString,params.swapId); 

}) .catch(function(err) {
       error(err,params.swapId);
    })   






}) .catch(function(err) {
       error(err,params.swapId);
    }) 

 
  
    		
}
 
function getUnspentForInput(utxos,inputs,idx){
	
	var input = inputs[idx];
	var inputHash = tools.buffer(input.hash.toString('hex'),'hex');//makes a copy of the object
		inputHash = (inputHash).reverse();
	for(var i = 0; i < utxos.length;i++){
		var  aUTXO = utxos[i];
		let txid = inputHash.toString('hex');
 

		if(txid == aUTXO.txid && aUTXO.vout == input.index){
			
			return aUTXO.value;
		} 
			
		 
	}

	throw "utxo not found.";

}

 

var counterpartyCall = function(method,params){
	
	console.log("cpcall ", JSON.stringify(params));
		 return new Promise(function(resolve, reject) {
     	makePostRequest(counterpartyUrl,counterpartyAuth,method, params,

		function callback(result){
			result = JSON.parse(result);
			console.log(result);
				if(result.error){
					reject(result.error.message);
				}
				else{
					resolve(result);
				}

		},
		function error(error){
    		reject(error);

		},


		);
    })
 
		 

	}

	var bitcoindCall = function(method,params){
	
	console.log("bitcoindCall ", JSON.stringify(params));
		 return new Promise(function(resolve, reject) {
     	makePostRequest(bitcoindUrl,bitcoindAuth,method, params,

		function callback(result){
			result = JSON.parse(result);
			console.log(result);
				if(result.error){
					reject(result.error.message);
				}
				else{
					resolve(result);
				}

		},
		function error(error){
    		reject(error);

		},


		);
    })
 
		 

	}
 
	function broadcastTransaction(hex,callback,error){

	if(NETWORK == bitcoin.networks.testnet){
		
			url = "https://api.blockcypher.com/v1/btc/test3/txs/push";

		}else{

			url = "https://api.indiesquare.me/v2/transactions/broadcast";

		}


	 	 var json = JSON.stringify({
                tx: hex
            });



	 	  console.log(json);
	 	   console.log(url);

		var xhr = new XMLHttpRequest();
	
 
			xhr.open("POST", url, true);
		 
		
		xhr.setRequestHeader("Content-Type", "application/json");  
		xhr.onload = function (e) {
  		
  		if (xhr.readyState === 4) {

  		  if (xhr.status === 201) {
  		  		console.log("postResponse "+xhr.responseText);
    		 callback(xhr.responseText);

    		} else {

    			 
	console.log("postErrorB "+xhr.responseText);

    	  error(xhr.responseText);

    		}
  		}
};
xhr.onerror = function (e) {
	console.log("postError "+JSON.stringify(e));
 error(e);
};
console.log(json);
xhr.send(json); 


	  
	}

	 function makePostRequest(url,auth,method,params,callback,error){

	 	 var json = JSON.stringify({
                jsonrpc: "2.0",
                id: 0,
                method: method,
                params: params

            });



	 	  console.log(json);
	 	   console.log(url);

		var xhr = new XMLHttpRequest();
	

		if(NETWORK == bitcoin.networks.testnet){
			xhr.open("POST", url, true);
		}
		else{
			xhr.open("POST", "https://api.indiesquare.me/v2"+endpoint, true);
		}
		
		xhr.setRequestHeader("Content-Type", "application/json");
		 xhr.setRequestHeader("Authorization", "Basic " + auth);
		 console.log(auth);
		xhr.onload = function (e) {
  		
  		if (xhr.readyState === 4) {

  		  if (xhr.status === 200) {
  		  		console.log("postResponse "+xhr.responseText);
    		 callback(xhr.responseText);

    		} else {
	console.log("postError1 "+xhr.responseText);
    	  error(xhr.responseText);

    		}
  		}
};
xhr.onerror = function (e) {
	console.log("postError "+JSON.stringify(e));
 error(e);
};
console.log(json);
xhr.send(json); 
    }


	 

 return SwapLib;
}();