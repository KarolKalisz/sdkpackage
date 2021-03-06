/**
 * Base Databound Class
 */
var org_scn_community_databound_Base = function(options){
	this.flatData = null;
	this.flattenData = function (value, options) {
		// Make a copy so we don't mess with references
		this.flatData = null;
		try{
			this.flatData = org_scn_community_databound.flatten(this.data(),{
				ignoreExpandedNodes : this.ignoreExpandedNodes(),
				ignoreResults : this.ignoreTotals(),
				useMockData : this.useMockData(),
				swapAxes : this.swapAxes()
			});	
		}catch(e){
			// alert("Problem flattening data:\n\n"+e);
		}
	};
	var that = this;
	this.componentInfo = {
		visible : true,
		title : "Databound Component",
		icon : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAk5JREFUeNpsU8tu00AUPeNXQh7NA6qKBAqBDYI1LBBCYlMWCJAQZVMWgMQHAN9B+gFIwAKQUNkA6oYlQkgQaIElBBBSiRqwnYfTh+143DuT2CQRk5zYc+ecO/eezLAwDMEYw4Ol58fp/Q7hPCGF/wzibRJeEu5en79Yk1rx8/DZi1u6rlfLpX0o5PLITmUh4hNiOF0HrU4bvxtr8H3/9rXLFxY1scg5rx49ckwS+0EAu9UGwsnt5Re5qZzE6ueVKk0XFbEmdqvsLyGfyyJhaFQWF2lpYRxiTXAqs6W4QlkBUxS8q31AqVzCnmIRmUxKEiKSKF98eptbsCwb3+p10rCRBEQIQ4b19T9E6MAwDCQTCaR3pcAph+tuYdv14Pdd0Tsi4/8lIChUhaapEqqqyDkntTJ8FzEeqsIvBDyQFcUJWra13La756and6NYKKKQz0vRKELywHF6sG0bpmWS2d5ynEDXDXfhyjy+1n8QoYW1RoMq0aCruuy1T2X7QZ9aSuLwoYM4O3cGT54uuXGCdCZzqbbyCeXyXlQOzNJ80kQBBb2NgYkfV79ITZxAtMODEI1GE6bZhi5MNMjEFJnIBya6ngfPH5gYiOBwKAM9k65G/arDZxBwerIxLySPsfhfUKJMHDwmRFDY+DzaBCPHXCb49fN71bQsdHuOLFFTNWniGCjm0VrH6aJp/pUaWf3wUMws3Lg5d+LkqauZ7NRpiidDcRnC8ctEY7vndF+/f/vm0eP7916RtslGTlWaMCPuy2hrE0O41yE0CRtCuyPAACZBGVgAMt/bAAAAAElFTkSuQmCC",
		author : "Mike Howles",
		description : "Description",
		topics : [{
			title : "Data Binding",
			content : "This component supports databinding.  Data typically comes from a BW, HANA or UNX source.  SDK Data Sources are also supported.  Properties include:<br/><ul>"+
			"<li>Ignore Totals - Allows you to ignore sub-totals/totals in your Data Source.</li>"+
			"<li>Ignore Expanded Nodes - Allows you to ignore hierarchy nodes that are expanded as this usually distorts visual results.</li>"+
			"<li>Use Mock Data - Allows you to preview visualization content when no Data Source is yet assigned.</li>"+
			"<li>Swap Axes - Interpret Rows as Columns, and Columns as Rows.</li>"+
			"</ul>"
		}]
	};
	this.props = {
		data : {
			value : null,
			onChange : this.flattenData,
			opts : {
				desc : "Data",
				cat : "Data",
				tooltip : "Data from datasource",
				value : null,
				noAps : true
			}
		},
		ignoreTotals : {
			value : true,
			onChange : this.flattenData,
			opts : {
				desc : "Ignore Totals",
				cat : "Data",
				tooltip : "Whether to ignore totals",
				apsControl : "checkbox"	
			}
		},
		ignoreExpandedNodes : {
			value : true,
			onChange : this.flattenData,
			opts : {
				desc : "Ignore Expanded Hierarchy Nodes",
				cat : "Data",
				tooltip : "Whether to ignore expanded hierarchy nodes",
				apsControl : "checkbox"	
			}
		},
		swapAxes : {
			value : false,
			onChange : this.flattenData,
			opts : {
				desc : "Swap Axes",
				cat : "Data",
				tooltip : "Whether to swap axes",
				apsControl : "checkbox"
			}
		},
		useMockData : {
			value : false,
			onChange : this.flattenData,
			opts : {
				desc : "Use Mock Data when no datasource",
				cat : "Data",
				tooltip : "Use Mock Data when no datasource",
				apsControl : "checkbox"
			}
		}
	};
	for(property in options){
		this.props[property] = options[property]
	};
	/*
	 * Create the aforementioned getter/setter and attach to 'this'.
	 */
	for(var property in this.props){
		this[property] = function(property){
			return function(value){
				if(value===undefined){
					return this.props[property].value;
				}else{
					this.props[property].value = value;
					this.props[property].changed = true;
					if(this.props[property].onChange) {
						this.props[property].onChange.call(this,this.props[property].value);
					}
					return this;
				}
			};
		}(property);
	}
	this.callOnSet = function(property,value){
		if(this.props[property] && this.props[property].onSet){
			return this.props[property].onSet(value);
		}else{
			return "ERROR";
		}
	}
	/**
	 * Relays Design Studio Property Information over to Additional Properties Sheet.
	 */
	this.getPropertyMetaData = function(){
		var r = [];
		for(var prop in this.props){
			var o = {
				name : prop,
				opts : this.props[prop].opts || {}
			}
			if(!o.opts.noAps) r.push(o);				
		}
		return JSON.stringify(r);
	}
	/**
	 * Component Information
	 */
	this.getComponentInformation = function(){
		return JSON.stringify(this.componentInfo);
	}
	this.init = function(){
		this.$().addClass("DesignStudioSCN");
	}
};