/**
 * @jsx React.DOM
 */

/* not used but thats how you can use touch events
 * */
//React.initializeTouchEvents(true);


/**
 * we will use yes for true
 * we will use no for false
 * 
 * React has some built ins that rely on state being true/false like classSet()
 * and these will not work with yes/no but can easily be modified / reproduced
 * 
 * this single app uses the yes/no var so if you want you can switch back to true/false
 * 
 * */
var yes = 'yes', no = 'no';
//var yes = true, no = false;




/**
 * wallet components
 * */
//main
snowUI.wallet = React.createClass({displayName: 'wallet',
	getInitialState: function() {
		var mystate = {
			config:this.props.config || {section:snowPath.wallet,wallet:false,moon:false},
			wally:false,
			testnet:false,
			ready:false,
			connectError:false,
			connected:false,
			connecting:true
		}
		if(this.props.config.section === snowPath.wallet && (!this.props.config.wallet || this.props.config.wallet === 'overview')) {
			mystate.connecting = false;
			mystate.connected = true;
		}
		return (mystate)
	},
	
	componentWillReceiveProps: function(nextProps) {
		
		var _this = this,
			sendProps = {config:nextProps.config};

		snowlog.log('willreceiveprops main wallet',_this.state, nextProps)
		
		
		//grab the data for this wallet
		if(!this.state.connected || (nextProps.config.wallet && nextProps.config.wallet !== _this.state.config.wallet)) {
			
			snowlog.log('grab wallet', nextProps.config.wally)
			
			sendProps.connecting = true;
			
			this.grabWallet(nextProps);
			
		} else if(nextProps.config.wallet && nextProps.config.wallet !== _this.state.config.wallet)  {
			
			snowmessage('message','Now using wallet '+ wally.name+'.',6000);
			
		} else {
			
			sendProps.connecting = false;
		}
		
		snowUI.methods.fadeOut();
		
		_this.setState(sendProps)
	},
	
	grabWallet: function(nextProps) {
		if(nextProps.config.wallet && nextProps.config.wallet !== 'new') {
			
			var _this = this;
			
			//run a status call and set connected state
				snowUI.methods.ajax.call("/api/snowcoins/local/wallet",{ wallet:nextProps.config.wallet,moon:'status' },function(resp) {
					snowlog.log('hitting  server new wallet',resp)
					if(resp.success === true)
					{
						
						//if(resp.data)changelock(resp.data.unlocked_until);
						if(resp.data && resp.data.testnet===true) {
							
							
							_this.setState({testnet:true,ready:true,connected:true,connecting:false})
							
						} else {
							
							
							_this.setState({testnet:false,ready:true,connected:true,connecting:false})
						
						}
						//changelock(resp.data.unlocked_until || 0);
						
					} else {
						_this.setState({testnet:false,ready:false,connectError:resp.error,connected:false,connecting:false})
						snowmessage('error','Connection Error... Check wallet configuration.',4000);
					}
				
				})
				
			
		} else {
			
			
			
		}
				
	},
	componentWillUpdate: function() {
		
		snowUI.methods.fadeOut();
		
	},
	componentDidUpdate: function() {
		
		snowUI.methods.fadeIn();
		if(this.state.testnet !== this.state.config.testnet)snowUI.methods.updateState({testnet:this.state.testnet});
	},
	componentWillMount: function() {
		
		snowUI.methods.fadeOut();
				
	},
	componentWillUnMount: function() {
		
		snowUI.methods.fadeOut();
				
	},
	componentDidMount: function() {
		
		if(this.state.config.wallet)
			this.grabWallet(this.state);
		
		snowUI.methods.fadeIn();
		if(this.state.testnet !== this.state.config.testnet)snowUI.methods.updateState({testnet:this.state.testnet});
	},
	updateState:function(state) {
		this.setState(state);
	},
	render: function() {
		
		snowlog.log('main wallet component - current state:', this.state)
	    
		var showcomp = (this.state.config.moon) ? this.state.config.moon : ''
		
		var renderMe; 
		
		if(snowUI[showcomp]) {
			renderMe = snowUI[showcomp]
		} else if(this.state.config.wallet) {
			
			if(this.state.config.wallet === 'new') 
				renderMe = snowUI.add
			else
				renderMe = snowUI.dashboard

		} else {
			
			renderMe = snowUI.overview
			
		}     
	    
		//stop loading
		snowUI.methods.loaderStop();
		if(this.state.connecting) {
			
			snowUI.methods.loaderStart();
			return (React.DOM.div(null))
			
		} else if(!this.state.connected) {
			
			return (

				React.DOM.div({className: "reactfade", id: "maindiv"}, " ", snowUI.connectError({config: this.state.config, ready: this.state.ready, setWalletState: this.updateState, message: this.state.connectError}), " ")

			);
			
		} else {
			
			return (

				React.DOM.div({className: "reactfade", id: "maindiv"}, " ", renderMe({config: this.state.config, ready: this.state.ready, setWalletState: this.updateState}), " ")

			);
		}
	}
});

//connect error component
snowUI.connectError = React.createClass({displayName: 'connectError',
	
	render: function() {
	    snowUI.methods.loaderStop();
	    snowlog.log('connect error component')
	    
	    return (
		React.DOM.div(null, 
			React.DOM.div({className: "requesterror"}, 
				React.DOM.p(null, 
				React.DOM.span(null, " Sorry, ", this.props.config.wally.name, " is unreachable at the moment.")
				), 
				React.DOM.p(null, this.props.message)
			)
		)			
		
	    );
	}
});

//overview list component
snowUI.overview = React.createClass({displayName: 'overview',
	menuClick: function(e) {
		
		e.preventDefault();
		
		var moon = $(e.target).parent()[0].dataset.snowmoon;
		
		snowUI.methods.valueRoute(moon);
		
		return false
	},
	deleteWallet: function(){
		
		return false;
	},
	componentDidUpdate: function() {
		
		sortCol('#snow-overview th');
		
	},	
	componentDidMount: function() {
			
		sortCol('#snow-overview th');
		
	},
	
	render: function() {
		snowUI.methods.loaderStop();
		snowlog.log('wallet overview component')
		if(this.props.config.mywallets instanceof Array) {
			var _this = this;
			//loop through our wallets and show a table
			var mytable = this.props.config.mywallets.map(function (w) {
				
				return (
					React.DOM.tr({key: w.key}, 
						React.DOM.td(null, React.DOM.a({onClick: _this.menuClick, 'data-snowmoon': snowPath.wallet + '/' + w.key+ '/update'}, React.DOM.span({className: "glyphicon glyphicon-pencil"}, " "))), 
						React.DOM.td(null, React.DOM.a({onClick: _this.menuClick, 'data-snowmoon': snowPath.wallet + '/' + w.key+ '/dashboard'},  w.name, " ")), 
						React.DOM.td(null, " ",  w.coin, " "), 
						React.DOM.td(null,  w.address, " "), 
						React.DOM.td(null, w.isSSL ? React.DOM.span({className: "glyphicon glyphicon-link"}) : ''), 
						React.DOM.td({onClick: _this.deleteWallet, 'data-snowmoon': w.key}, React.DOM.span({style: {cursor:"pointer"}, className: "removewallet text-danger glyphicon glyphicon-remove-sign"}, " "))
					)
				);
			});				
				
		}
		return (
			React.DOM.div({id: "snow-overview", className: "bs-example"}, 
				
				React.DOM.button({className: "btn btn-info btn-xs nav-item-add", onClick: snowUI.methods.buttonRoute, 'data-snowmoon': snowPath.wallet + '/new'}, "Add New Wallet"), 
				React.DOM.table({className: "table table-hover"}, 
					React.DOM.thead(null, 
						React.DOM.tr({key: "whead"}, 
							React.DOM.th(null, React.DOM.span({className: "glyphicon glyphicon-pencil"})), 
							React.DOM.th(null, React.DOM.span({className: "glyphicon glyphicon-sort"}, "name")), 
							React.DOM.th(null, React.DOM.span({className: "glyphicon glyphicon-sort"}, "coin")), 
							React.DOM.th(null, React.DOM.span({className: "glyphicon glyphicon-sort"}, "address")), 
							React.DOM.th({className: "snowsortisempty"}, React.DOM.span({className: "glyphicon glyphicon-sort"}, "ssl")), 
							React.DOM.th(null, React.DOM.span({className: "text-danger glyphicon glyphicon-remove-sign"}))
						)
					), 
					React.DOM.tbody(null, 
						mytable
					)
				)
				
		
		
			)			
		
		);
	}
});
//add new wallet component
snowUI.add = React.createClass({displayName: 'add',
	
	render: function() {
	    snowUI.methods.loaderStop();
	    snowlog.log('wallet add component')
	    return (
		React.DOM.div(null, "Add New Wallet ")			
		
	    );
	}
});
//wallet dashboard component
snowUI.dashboard = React.createClass({displayName: 'dashboard',
	getInitialState: function() {
		
		return {mounted:false,ready:this.props.ready};
		
		
	},
	componentWillReceiveProps: function (nextProps) {
		var _this = this
		snowlog.log('dashboard will receive props',this.props,nextProps)
		//this.setState({ready:nextProps.ready})
		if(this.props.config.wallet !== nextProps.config.wallet)this.getData(nextProps,function(resp){_this.setState({data:resp.data,mounted:true,ready:nextProps.ready}) })
		
	},
	componentWillUpdate: function () {
		var _this = this
		
		snowlog.log('dashboard will update',this.props)
	},
	componentDidMount: function() {
		var _this = this
		snowlog.log('dashboard did mount',this.props)
		//_this.setState({mounted:true})
		this.getData(this.props,function(resp){ _this.setState({data:resp.data,mounted:true}) })
		
	},
	componentWillUnMount: function() {
		this.setState({mounted:false,data:false,ready:false})
	},
	getData: function (props,cb) {
		snowlog.log('data',props)
		var url = "/api/snowcoins/local/wallet",
			data = { wallet:props.config.wallet,moon:props.config.moon},
			_this = this;
		
		snowUI.methods.ajax.call(url,data,function(resp) {
			console.log(resp)
			if(resp.success === true) {
				cb(resp)
			} else {
				snowmessage('error',resp.error,3500)
				_this.props.setWalletState({connectError:true})
			}
		})
		return false
	},
	
	render: function() {
		
		
		snowlog.log('wallet dashboard component',this.state.mounted)
		
		if(this.state.mounted) {
			snowUI.methods.loaderStop();
			var data = this.state.data;
			
			var loop = (data instanceof Object) ? Object.keys(data) : [];
			var mystatus = loop.map(function(k,v) {
		
				return (
					React.DOM.div({key: k, className: "col-xs-12 col-sm-6 col-md-6"}, 
						React.DOM.div({className: "snow-status snow-block"}, 
							React.DOM.div({className: "snow-block-heading"}, 
								React.DOM.p(null, k)
							), 
							React.DOM.div({className: "snow-status-body"}, 
								React.DOM.p(null, data[k])
							)
						)
					)
				);
			}); 

			
			return (
			React.DOM.div({className: "snow-dashboard"}, 
				React.DOM.div({className: "snow-block snow-balance"}, 
					React.DOM.div({className: "snow-block-heading"}, 
						React.DOM.p(null, "balance")
					), 
					React.DOM.div({className: "snow-balance-body"}, 
						React.DOM.p(null, data.balance, " ", React.DOM.span({className: "coinstamp"}, this.props.config.wally.coinstamp, " "))
					)
				), 
				React.DOM.div({className: "col-xs-12 col-sm-6 col-md-6"}, 
					React.DOM.div({className: "snow-block-lg snow-options"}, 
						React.DOM.div({className: "snow-block-heading"}, 
							React.DOM.p(null, "wallet options")
						), 
						React.DOM.div({className: "snow-block-body"}, 
							React.DOM.div(null, React.DOM.a({className: "backupwalletbutton text-muted"}, "Backup Wallet")), 
							React.DOM.div(null, React.DOM.a({className: "updatecoin"}, "Update ", this.props.config.wally.name.toUpperCase(), "   "))
						)
					)
				), 
				React.DOM.div({className: "clearfix"}), 
				React.DOM.div({className: "snow-status"}, 
					mystatus
				)
			)			

			);
		} else {
			return(React.DOM.div(null))
		}

	}
});
//overview list component
snowUI.send = React.createClass({displayName: 'send',
	
	render: function() {
	    snowUI.methods.loaderStop();
	    snowlog.log('wallet send component')
	    return (
		React.DOM.div(null, "Send ")			
		
	    );
	}
});
//overview list component
snowUI.accounts = React.createClass({displayName: 'accounts',
	
	render: function() {
	    snowUI.methods.loaderStop();
	    snowlog.log('wallet accounts component')
	    return (
		React.DOM.div(null, "Accounts ")			
		
	    );
	}
});
//overview list component
snowUI.transactions = React.createClass({displayName: 'transactions',
	
	render: function() {
	    snowUI.methods.loaderStop();
	    snowlog.log('wallet transaction component')
	    return (
		React.DOM.div(null, "Transactions ")			
		
	    );
	}
});


