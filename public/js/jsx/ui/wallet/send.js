/**
 * @jsx React.DOM
 */



//send component
snowUI.wallet.send = React.createClass({
	getInitialState: function() {
		
		var _this = this
		
		return {
			requesting:false,
			mounted:false,
			ready:this.props.ready,
			confirm:false,
			unlock:false,
			receipt: false,
			transaction: false,
			error: false,
			persist: {}
			
		};
		
	},
	componentWillReceiveProps: function (nextProps) {
		var _this = this
		if(snowUI.debug) snowLog.log('send will receive props',this.state.unlock,nextProps.config.unlocked)
		//this.setState({ready:nextProps.ready})
		if(this.state.unlock === true && nextProps.config.unlocked === true) {
			if(snowUI.debug) snowLog.log('send set to confirm')
			this.setState({unlock:false,confirm:true});
			
		} else {
			if(this.props.config.wallet !== nextProps.config.wallet)this.getData(nextProps,function(resp){_this.setState({accounts:resp.accounts,data:resp.data,snowmoney:resp.snowmoney,mounted:true,ready:nextProps.ready}) })
		}
	},
	componentDidUpdate: function () {
		var _this = this
		if(snowUI.debug) snowLog.log('send did update',this.props)
		snowUI.watchLoader();
		$('[rel=popover]').popover();
		$('.bstooltip').tooltip()
		
	},
	componentDidMount: function() {
		
	},
	killTooltip: function() {
		$('.snow-send #changeamountspan').tooltip('destroy');
		$('.snow-send #sendcoinamount').tooltip('destroy');
		$('.snow-send #convamountspan').tooltip('destroy');
	},
	componentWillMount: function() {
		var _this = this
		if(snowUI.debug) snowLog.log('send did mount',this.props)
		this.getData(this.props,function(resp){ _this.setState({data:resp.data,snowmoney:resp.snowmoney,accounts:resp.accounts,mounted:true}) })
		this.killTooltip();
		$('.snow-send #convamount').html(' ')
		$('[rel=qrpopover]').popover();
	
	},
	componentWillUpdate: function() {
		this.killTooltip();
		$('.snow-send #convamount').html(' ')
	},
	componentWillUnMount: function() {
		this.setState({mounted:false,data:false,ready:false})
		
	},
	getData: function (props,cb) {
		if(snowUI.debug) snowLog.log('send data',props)
		var url = "/api/snowcoins/local/wallet",
			data = { wallet:props.config.wallet,moon:props.config.moon},
			_this = this;
		
		snowUI.ajax.GET(url,data,function(resp) {
			if(snowUI.debug) snowLog.log(resp)
			if(resp.success === true) {
				cb(resp)
			} else {
				snowUI.flash('error',resp.error,3500)
				_this.props.setWalletState({connectError:true})
			}
		})
		return false
	},
	addressBook: function(e) {
		
		var url= "/api/snowcoins/local/contacts",
			  data= { wallet:this.props.config.wally.key},
			_this = this;
		
		snowUI.ajax.GET(url,data,function(resp) {
			if(snowUI.debug) snowLog.log(resp)
			if(resp.success === true) {
				_this.setState({addressBookHtml:resp.html});
				snowUI.methods.modals.addressBook.open();
			} else {
				snowUI.flash('error',resp.error,3500)
				
			}
		})
		return false
	},
	saveAddressForm: function(e) {
		if(snowUI.debug) snowLog.log('change save address');
		var fields = $('#sendcoinshowname');
		if(fields.css('display') === 'none') {
			fields.toggle(400);
		} else {
			fields.toggle(false);
		}
		
	},
	watchAmount: function(e) {
		
		var currentwally = this.props.config.wally;
		var snowmoney = this.state.snowmoney;
		
		var getfrom=$('.snow-send #snowchangefrom').attr('data-snowticker');
			
		var enteredamount=parseFloat($('.snow-send #sendcoinamount').val());
		if(isNaN(enteredamount))enteredamount=0;
		
		var stamp=$('.snow-send #snowchangefrom').attr('data-snowstamp');
		if(getfrom===currentwally.cointicker) {
			stamp='$ ';
			var to=currentwally.currency,from=getfrom;
		}
		else {
			stamp=' '+currentwally.coinstamp;
			var from=getfrom,to=currentwally.cointicker;
		}
		//if(snowUI.debug) snowLog.log('keyup',from,to,snowmoney[from][to]);
		if(snowmoney[from][to] && snowmoney[from][to].price) {
					
			showvalue=snowmoney[from][to].price * enteredamount;
			if(to==='usd' || to==='eur'){
				$('.snow-send #sendcointrueamount').val(enteredamount.toFixed(8).replace(/\.?0+$/, ""));
				showvalue=parseFloat(showvalue.toFixed(2));
			}
			else {
				$('.snow-send #sendcointrueamount').val(showvalue.toFixed(8).replace(/\.?0+$/, ""));
				showvalue=parseFloat(showvalue.toFixed(8));
				
			}
			$('.snow-send #changeamountbefore').text('');
			$('.snow-send #changeamountafter').text('');
			if(to==='usd')$('.snow-send #changeamountbefore').text(stamp);
			else $('.snow-send #changeamountafter').text(' ' + stamp);
			$('.snow-send #convamount').text(parseFloat(snowmoney[from][to].price).toFixed(8).replace(/\.?0+$/, ""));
			
			$('.snow-send #changeamount').text(showvalue );
			
		}
		else {
			$('.snow-send #sendcointrueamount').val(enteredamount.toFixed(8).replace(/\.?0+$/, ""));
		}
		$('.snow-send #convamountspan').tooltip('destroy');
		$('.snow-send #convamountspan').tooltip({title:'1 ' + from + ' to ' + to + ' equals '}).tooltip('show');				
		var balspan = $('.snow-send .snow-balance-body').find('span').first(),
			availbal = parseFloat($('.snow-send #snow-balance-input').val()),
			minus = $('.snow-send #sendcointrueamount').val(),
			changebalance = availbal - parseFloat(minus);
			
		balspan.text(changebalance.formatMoney(8,',','.'));
		
	},
	watchTicker: function(e) {
		
		var currentwally = this.props.config.wally;
		var snowmoney = this.state.snowmoney;
		
		var theLi = $(e.target).closest('li')
		
		var changeto=theLi.text();
		var changestamp=theLi.attr('data-snowstamp');
		var changeticker=theLi.attr('data-snowticker');
		var currentticker=$('.snow-send #snowchangefrom').attr('data-snowticker');
		var ddclass = 'bg-info';
		if(changeticker===currentwally.cointicker) {
			$('.snow-send #sendcoinamount').addClass('active').next().next().removeClass('active');
			$('.snow-send #changeamountspan').tooltip('destroy');
			$('.snow-send #sendcoinamount').tooltip({title:'We will send this many ' + currentwally.cointicker}).tooltip('show');
		} else {
			$('.snow-send #sendcoinamount').removeClass('active').next().next().addClass('active');
			$('.snow-send #sendcoinamount').tooltip('destroy');
			$('.snow-send #changeamountspan').tooltip({title:'We will send this many ' + currentwally.cointicker}).tooltip('show');
			
		}
		if(changeticker!=currentticker) {
			$('.snow-send #snowchangefrom').attr('data-snowticker',changeticker);
			$('.snow-send #snowchangefrom').attr('data-snowstamp',changestamp);
			$('.snow-send #changestamp').children().first().text(changeto);
			$('.snow-send #sendcoinamount').focus();
			if(changeticker==='usd' || changeticker==='eur')$('.snow-send #sendcoinamount').prop('step','0.01');
			else if(changeticker==='ltc' || changeticker==='btc')$('.snow-send #sendcoinamount').prop('step','0.001');
			else $('.snow-send #sendcoinamount').prop('step','1');
		}	
		
	},
	walletForm: function(e) {
		e.preventDefault()
		var _this = this;
		var currentwally = this.props.config.wally;
		
		var next = true;
		var ticker = $('.snow-send .change-coin-stamp').attr('data-snowticker');
		var amount = parseFloat($('.snow-send #sendcointrueamount').val());
		var to = $('.snow-send #sendcointoaddress').val();
		var bal = parseFloat($('.snow-send-body .snow-balance-body').text().replace(/,/g,''));
		var from = $('.snow-send #sendcoinfromaccount').val();
		if(snowUI.debug) snowLog.log('send',parseInt(amount));
		if(amount<=0 || isNaN(amount) || amount===Infinity)
		{
			$(".snow-send #sendcoinamount").parent().addClass('has-error');
			next=false;
		}
		if(to==='') 
		{
			$(".snow-send #sendcointoaddress").parent().addClass('has-error');
			next=false;
		}
		if(next===true)
		{
			
			var saveAs = $(".snow-send  #sendcoinaddressname").val(),
				saveAddress = $(".snow-send  #sendcoinsaveaddr").val();
			if(snowUI.debug) snowLog.log("save address? ",saveAddress)
			if(saveAddress === 'save' && saveAs) {
				var url = "/api/snowcoins/local/contacts",
					  data = { stop:1,wallet:currentwally.key,action:'add',name:saveAs,address:to};
				snowUI.ajax.GET(url,data,function(resp) {
					if(snowUI.debug) snowLog.log(resp)
					if(resp.success === true) {
						snowUI.flash('success','Address saved as ' + saveAs,3500)
					} else {
						snowUI.flash('error',"Address saved previously",3500)
						
					}
				});
			}
			
			var options = {
				amount: amount,
				ticker: ticker,
				to: to,
				balance: bal,
				from: from,
				saveAs: saveAs,
				memo: $(".snow-send  #sendcoinmemo").val(),
				message: $(".snow-send  #sendcointomessage").val()
							
			};
			
			_this.setState({confirm:true,unlock:false,persist:options});
			
		}
		
	},
	sendConfirmed: function() {
		var 	_this = this,
			nowtime=new Date().getTime(),
			command=(this.state.persist.from==='_default')?'send':'sendfromaccount',
			url= "/api/snowcoins/local/gated",
			data =  { checkauth:nowtime,account:this.state.persist.from,comment:this.state.persist.memo,commentto:this.state.persist.message,wallet: this.props.config.wally.key,command:command,amount:this.state.persist.amount,toaddress:this.state.persist.to};
		
		
		if(_this.props.config.unlocked === false) {
				
			_this.setState({confirm:true,unlock:true});
			snowUI.methods.modals.unlockWallet.open();
			
			return false;	
			
		} else {
			snowUI.ajax.GET(url,data,function(resp) {
				if(snowUI.debug) snowLog.log(resp)
				if(resp.success === true)
				{
					_this.setState({persist:{},confirm:false,receipt:true,transaction:resp.tx});
				}
				else
				{
					_this.setState({confirm:false,error:resp.error,});
				}
			});
				  
			return false;	

		}
		
	},
	cancelConfirm: function() {
		var _this = this; 
		this.getData(this.props,function(resp){
			_this.setState({
				data:resp.data,
				snowmoney:resp.snowmoney,
				accounts:resp.accounts,
				mounted:true,
				persist:{},
				confirm:false,
				receipt:false,
				transaction:false,
				error:false
			});
		});
	},
	render: function() {
		var _this = this;
		
		if(this.state.receipt) {
			/* confirm sending coins */
			return (<div id="snow-send" className="snow-send bs-example">
						<div  style={{padding:'5px 20px'}} >
							<div className="col-xs-12 ">
								<h4 className="profile-form__heading">Send Coin Transaction</h4>
							</div>
					
							<div dangerouslySetInnerHTML={{__html: _this.state.transaction}} />
							<p />
							<button className="btn btn-default " onClick={_this.cancelConfirm} >Return</button>
						</div>
				</div>)
		
		} else if(this.state.confirm) {
			if(snowUI.debug) snowLog.log('wallet confirm send')
			var currentwally = this.props.config.wally;
			var html='<div><div class="adderror" style="dispaly:none;"></div> <span class="send-modal-amount">'+parseFloat(this.state.persist.amount).formatMoney(8)+'</span><span class="coinstamp">'+currentwally.coinstamp+'</span></div><div class="send-modal-text"> to address<p><strong>'+this.state.persist.to+'</strong></p>from account<p class="send-modal-account1"><strong>'+this.state.persist.from+'</strong></p><p><span class="snow-balance-span1" style="font-weight:bold">'+(this.state.persist.balance).formatMoney(8)+'</span> <span class="coinstamp">'+currentwally.coinstamp+' wallet balance after send</span><div id="3456756" style="display:none;">to='+this.state.persist.to+'<br />&account='+this.state.persist.from+'<br />&amount='+this.state.persist.amount+'<br />&checkauth={generate-on-submit}<br />&sendnow=yes</div></p></div>';
			
			/* confirm sending coins */
			return (<div id="snow-send" className="snow-send bs-example">
						<div  style={{padding:'5px 20px'}} >
							<div className="col-xs-12 ">
								<h4 className="profile-form__heading">Confirm Send Coins</h4>
							</div>
					
						
							<div dangerouslySetInnerHTML={{__html: html}} />
							
							<button onClick={_this.sendConfirmed} className={_this.props.config.unlocked ? "btn btn-warning" : "btn "}>{_this.props.config.unlocked ? "Send Coins Now" : "Unlock Wallet"}</button>
							<span> &nbsp; </span>
							<button className="btn btn-default " onClick={_this.cancelConfirm} >Cancel</button>
						</div>
				</div>)
			
		} else if(this.state.mounted) {
			
			var snowmoney = this.state.snowmoney;
			var wally = this.props.config.wally;
			var tickerlist = function() {
				var lis = [(<li key="lit" onClick={_this.watchTicker} className="change-coin-stamp" role="presentation" data-snowstamp={_this.props.config.wally.coinstamp} data-snowticker={_this.props.config.wally.cointicker}><a> {_this.props.config.wally.cointicker.toUpperCase()}</a></li>)]
				if (snowmoney['usd'][wally.cointicker] && snowmoney['usd'][wally.cointicker].price) 
					lis.push(<li key="lit1" onClick={_this.watchTicker} role="presentation" data-snowstamp="USD" data-snowticker="usd" className="change-coin-stamp"><a>USD</a></li>)
				if (snowmoney['eur'][wally.cointicker] && snowmoney['eur'][wally.cointicker].price) 
					lis.push(<li key="lit2" onClick={_this.watchTicker} role="presentation" data-snowstamp="EUR" data-snowticker="eur" className="change-coin-stamp"><a>EUR</a></li>)			
				if (snowmoney['btc'][wally.cointicker] && snowmoney['btc'][wally.cointicker].price) 
					lis.push(<li key="lit3" onClick={_this.watchTicker} role="presentation" data-snowstamp="BTC" data-snowticker="btc" className="change-coin-stamp"><a>BTC</a></li>)
				if (snowmoney['ltc'][wally.cointicker] && snowmoney['ltc'][wally.cointicker].price) 
					lis.push(<li key="lit4" onClick={_this.watchTicker} role="presentation" data-snowstamp="LTC" data-snowticker="ltc" className="change-coin-stamp"><a>LTC</a></li>)
				if (wally.cointicker!='doge' && snowmoney['doge'][wally.cointicker] && snowmoney['doge'][wally.cointicker].price) 
					lis.push(<li key="lit5" onClick={_this.watchTicker} role="presentation" data-snowstamp="doge" data-snowticker="doge" className="change-coin-stamp"><a>DOGE</a></li>)
				return lis
			}
			
			if(this.state.accounts instanceof Array) {
				var accs =  this.state.accounts.map(function(v) {
					return (
						<option key={v.name} value={v.name}>{v.name}</option>
					);   
				});
					    
			} else {
				var accs = '<option value="">no accounts found</option>'
			}
			/* check for accounts and addresses in the url */
			var param = {from:{},to:{}}
			var pFrom = _this.props.config.params.indexOf('from'),
				pTo = _this.props.config.params.indexOf('to');
			// if there is a from in the url grab the next param which can be an account or address
			param.from.account = pFrom!==-1 ? _this.props.config.params[pFrom+1] : '';
			param.from.address = pFrom!==-1 ? _this.props.config.params[pFrom+1] : '';
			// if there is a to in the url grab the next param which should be an address
			param.to.address = pTo!==-1 ? _this.props.config.params[pTo+1] : '';	
			
			return (
				<div>
				<div id="snow-send" className="snow-send bs-example">
					<div className="col-xs-12 col-sm-offset-1 col-sm-10 col-md-10 col-lg-10">
						<div id="prettysuccess" style={{display:'none'}}>
							<div className="alert alert-success alert-dismissable">
								<button data-dismiss="alert" aria-hidden="true" className="close">×</button>
								<p></p>
							</div>
						</div>
					<div id="prettyerror" style={{display:_this.state.error ? 'block' : 'none'}}>
						<div className="alert alert-danger alert-dismissable">
							<button data-dismiss="alert" aria-hidden="true" className="close">×</button>
							<p>{_this.state.error}</p>
						</div>
					</div>
					<form  onSubmit={this.walletForm} id="snowsendcoin" className="snow-block-lg">
					<div className="snow-block-heading"></div>
					<div className="form-group input-group">
						<span className="input-group-addon input-group-sm coinstamp"> 
							<div className="dropdown">
								<a id="snowchangefrom" data-toggle="dropdown" data-snowstamp={_this.props.config.wally.coinstamp} data-snowticker={_this.props.config.wally.cointicker} className="dropdown-toggle">
									<span id="changestamp">{_this.props.config.wally.cointicker.toUpperCase()} </span>&nbsp; <span className="caret"></span>
								</a>
								<ul role="menu" aria-labelledby="dda2" className="dropdown-menu">
									{tickerlist()}						
								</ul>
							</div>
						</span>
						<span id="convamountspan" data-toggle="tooltip"  data-placement="top" data-container="#snow-send" className="input-group-addon input-group-sm coinstamp bstooltip" > 
							<span id="convamount" ></span>
						</span>
						<input required="required" type="text" pattern="[-+]?[0-9]*[.,]?[0-9]+" defaultValue={this.state.persist.amount} id="sendcoinamount" name="sendcoinamount" placeholder="Amount" data-toggle="tooltip" data-placement="top"  data-container="#snow-send" className="form-control coinstamp bstooltip watchme active" title="We will send this amount" onChange={_this.watchAmount} onKeyUp={_this.watchAmount} onFocus={_this.watchAmount} />
						<input id="sendcointrueamount" type="hidden" defaultValue={this.state.persist.amount || "0"} />
						
						<span id="changeamountspan" data-toggle="tooltip" data-placement="top" data-container="#snow-send" className="input-group-addon input-group-sm coinstamp watchme" > 
							
							<span id="changeamountbefore">$ </span>
							<span id="changeamount" >0</span>
							<span id="changeamountafter"></span>
						</span>
					</div>
					<div style={{textAlign:'right',marginTop:-5}}><a rel="popover" data-container="body" data-toggle="popover" data-placement="left" data-html="true" data-content={"The left bookend selects the currency you want to enter. The right bookend will show you a converted amount.   <br /><br /> Select " + _this.props.config.wally.cointicker.toUpperCase() + " to see a conversion to " + _this.props.config.wally.currency.toUpperCase() + ". You will send the amount entered in the blue box<br /><br /> Select another currency to convert the entered amount to " + _this.props.config.wally.cointicker.toUpperCase() + ". The right bookend will be blue and the amount you send. "} className="helppopover">help</a></div>
					<div style={{textAlign:'left'}} className="snow-send-body">
						<div className="snow-balance-body"> 
							<span>{parseFloat(_this.state.data.balance).formatMoney()}</span>
							<input id="snow-balance-input" type="hidden" value={parseFloat(_this.state.data.balance)} /> <span style={{color:'#ccc'}} className="coinstamp"> {_this.props.config.wally.coinstamp} &nbsp; after sending</span>
						</div>
					</div>
					<div className="form-group input-group">
						<span className="input-group-addon input-group-sm coinstamp">From</span>
						<select id="sendcoinfromaccount" name="sendcoinfromaccount" className="form-control coinstamp" defaultValue={this.state.persist.from || param.from.account}>
							{accs}
						</select>
					</div>
					<div className="form-group input-group">
						<span className="input-group-addon input-group-sm coinstamp">To</span>
						<input required="required" id="sendcointoaddress" name="sendcointoaddress" placeholder="Coin Address" defaultValue={this.state.persist.to || param.to.address} className="form-control coinstamp" />
						<span  style={{cursor:'pointer'}} onClick={_this.addressBook} className="input-group-addon input-group-sm glyphicon glyphicon-user"></span>
					</div>
					<div className="form-group input-group">
						<span className="input-group-addon input-group-sm coinstamp">
							<input type="checkbox" id="sendcoinsaveaddr" value="save" onChange={_this.saveAddressForm} />
						</span>
						<label  style={{textAlign:'left'}} className="form-control coinstamp">Save this address to my contacts</label>
					</div>
					<div id="sendcoinshowname" style={{display:'none'}} className="form-group input-group bg-info">
						<span className="input-group-addon input-group-sm coinstamp">Name</span>
						<input id="sendcoinaddressname" name="sendcoinaddressname" placeholder="name for address"  className="form-control coinstamp" defaultValue={this.state.persist.saveAs}  />
					</div>
					<div className="form-group input-group"><span className="input-group-addon input-group-sm coinstamp">Message </span>
					<input id="sendcointomessage" name="sendcointomessage" placeholder="message"  className="form-control coinstamp" defaultValue={this.state.persist.message} />
					</div>
					<div className="form-group input-group"><span className="input-group-addon input-group-sm coinstamp">Memo</span>
					<input id="sendcoinmemo" name="sendcoinmemo" placeholder="memo"  className="form-control coinstamp" defaultValue={this.state.persist.memo} />
					</div>
					<div className="form-group">
						<button type="submit" id="buttonsend" className="btn btn-sm snowsendcoin">Send Coin</button>
						
					</div>
					<div className="clearfix"></div>
					</form>
					</div>
					
					<div className="clearfix"></div>
				</div>		
				{snowUI.snowModals.addressBook.call(this)}
			</div>
		    );
		} else {
			return (<div />)
		}
	}
});


/**
 * 2014 snowkeeper
 * github.com/snowkeeper
 * npmjs.org/snowkeeper
 * 
 * Peace :0)
 * 
 * */
