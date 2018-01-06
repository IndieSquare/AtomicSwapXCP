import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersistenceModule } from 'angular-persistence';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service'; 
import { MainPageComponent } from './main-page/main-page.component';
import { RouterModule, Routes }  from '@angular/router';
import { SwapItemComponent } from './swap-item/swap-item.component';
const appRoutes: Routes = [
  { path: 'wif', component: MainPageComponent } 
];
@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent,
    SwapItemComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    PersistenceModule,
    HttpModule,
    RouterModule.forRoot(appRoutes) 
  ],
  exports: [
    RouterModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
