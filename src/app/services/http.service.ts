import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class HTTPService{
   
  constructor(private _http:Http){}

     

    getBalance(address:string){
         var header = new Headers();
 

     var url = "https://btgexplorer.com/api/addr/"+address+"/?noTxList=1";
        
      var header = new Headers();
      header.append('Content-type', 'Content-Type: application/json');
       
      return this._http.get(url, {
        headers:header
      })
      .map(res => res.json());
    };

     /*getFiatVal(){
         var header = new Headers();
 

     var url = "https://api.coinmarketcap.com/v1/ticker/bitcoin-gold/?convert=USD"
        
      var header = new Headers();
      header.append('Content-type', 'Content-Type: application/json');
       
      return this._http.get(url, {
        headers:header
      })
      .map(res => res.json());
    };*/


      getFiatVal(){
         var header = new Headers();
 

     var url = "https://api.coinmarketcap.com/v1/ticker/bitcoin-gold/?convert=USD"
       
      
 var json = JSON.stringify({
             url: url,
        });

      var params = json;
      var header = new Headers();
      header.append('Content-type', 'Content-Type: application/json');
       
    return this._http.post("https://sarutobigob1309.herokuapp.com/returnUrl",params, {
        headers:header
      })
      .map(res => res.json());

    };


   

 
 

}