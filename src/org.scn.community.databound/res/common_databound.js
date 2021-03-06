/**
 * Copyright 2014 Scn SDK Community
 * 
 * Original Source Code Location:
 *  https://github.com/org-scn-design-studio-community/sdkpackage/
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *  
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License. 
 */

var org_scn_community_databound = org_scn_community_databound || {};

org_scn_community_databound.hasData = function (data) {
	
	if(!data || data == "" || data == undefined) {
		return false;
	}
	
	return true;
};

org_scn_community_databound.hasDataAndMetadata = function (data, metadata) {
	
	if(!data || data == "" || data == undefined) {
		return false;
	}
	
	if(!metadata || metadata == "" || metadata == undefined) {
		return false;
	}
	
	if(!metadata || !metadata.dimensions) {
		return false;
	}
	
	return true;
};

org_scn_community_databound.initializeOptions = function () {
	var options = {};
	
	options.iMaxNumber = 100;
	options.iTopBottom = "Both";
	options.iSortBy = "Default";
	options.iDuplicates = "Ignore";
	options.iNumberOfDecimals = 2;
	options.allKeys = false;
	options.idPrefix = "";
	options.iDisplayText = "Text";
	options.ignoreResults = false;
	options.ignoreExpandedNodes = false;
	options.useMockData = true;
	options.dimensionSeparator = " | ";
	options.createHaderRow = true;
	options.conditionColumns = undefined; // JSON condition definition, work in progress, eg. {"operator": "and", "rules": [{"condition": "contains", "members": ["AUSC", "AUSA"]}]}
	options.conditionRows = undefined; // JSON condition definition, work in progress
	options.conditionContent = undefined; // JSON condition definition, work in progress
	options.collectMultiple = true;
	
	return options;
}

org_scn_community_databound.initializeEmptyReturn = function () {
	var returnObject = {};
	
	returnObject.list = [];
	returnObject.maxDelta = 0;
	returnObject.average = 0;
	returnObject.maxValue = 0;
	returnObject.minValue = 0;
	returnObject.allKeys = "";
	
	return returnObject;
}

org_scn_community_databound.getTopBottomElementsForDimension = function (data, metadata, requestedDimensionKey, options) {
	if(options == undefined) {
		options = org_scn_community_databound.initializeOptions();
	}
	
	if(!metadata || !metadata.dimensions) {
		return org_scn_community_databound.initializeEmptyReturn();;
	}
	
	//FBL20141216 Removed an additionnal S from the variable name
	var dimensionStartIndex = -1;
	var dimensionEndIndex   = -1;

	// column or row (more rows as columns, means a column, vertical)
	// 1.3 release does not bring rowCount and columnCount...
	var isARow = (data.rowCount && data.columnCount && data.rowCount < data.columnCount);

	if(requestedDimensionKey == undefined || requestedDimensionKey == "") {
		dimensionStartIndex = -1;
		dimensionEndIndex = -1;
	} else {
		for (var i = 0; i < metadata.dimensions.length; i++) {
			var dimension = metadata.dimensions[i];
	
			if(dimension.key == requestedDimensionKey) {
				dimensionStartIndex = i;
				dimensionEndIndex = i;
	
				if(dimension.axis == "ROWS") {
					isARow = false;
				}
				if(dimension.axis == "COLUMNS") {
					isARow = true;
				}
				break;
			}
		}
		
		// if dimension is not in the resultset, empty list back
		if(dimensionStartIndex == -1) {
			return org_scn_community_databound.initializeEmptyReturn();;
		}
	}
	
	return org_scn_community_databound.getTopBottomElementsByIndex(data, metadata, dimensionStartIndex, dimensionEndIndex, options);
};

/**
 * Global Function for getting Top / Bottom from data
 * iMaxNumber - integer, > 0
 * iTopBottom - string, "Top X" | "Bottom X" | "Both"
 * iSortBy - string, "Default" | <some other string>
 * iDuplicates - string, "Ignore Duplicates" | <some other string>
 */
org_scn_community_databound.getTopBottomElements = function (data, metadata, options) {

	var dimensionStartIndex = -1;
	var dimensionEndIndex = -1;

	return org_scn_community_databound.getTopBottomElementsByIndex(data, metadata, dimensionStartIndex, dimensionEndIndex, options);
};

org_scn_community_databound.getTopBottomElementsByIndex = function (data, metadata, dimensionStartIndex, dimensionEndIndex, options) {
	var list = [];
	
	if(!data || data == "" || data == undefined) {
		return org_scn_community_databound.initializeEmptyReturn();
	}
	
	var lValues = [];
	
	// column or row (more rows as columns, means a column)
	// 1.3 release does not bring rowCount and columnCount...
	var isARow = (data.rowCount && data.columnCount && data.rowCount < data.columnCount);
	
	if (!isARow) {
		// search for the last dimension in rows
		for (var i = 0; i < metadata.dimensions.length; i++) {
			var dimension = metadata.dimensions[i];

			if(dimension.axis == "ROWS") {
				if(dimensionStartIndex == -1) {
					dimensionStartIndex = i;	
				}
				if(dimensionEndIndex == -1) {
					dimensionEndIndex = i;
				}
			}
		}
	} else {
		// search for the last dimension
		for (var i = 0; i < metadata.dimensions.length; i++) {
			var dimension = metadata.dimensions[i];

			if(dimension.axis == "COLUMNS") {
				if(dimensionStartIndex == -1) {
					dimensionStartIndex = i;	
				}
				if(dimensionEndIndex == -1) {
					dimensionEndIndex = i;
				}
			}
		}
	}
	
	var allKeys = "|";
	
	for (var i = 0; i < data.data.length; i++) {
		var tupel = data.tuples[i]; 
		var isResult = metadata.dimensions[dimensionEndIndex].members[tupel[dimensionEndIndex]].type == "RESULT";
		
		if(!isResult) {
			var key =  metadata.dimensions[dimensionEndIndex].members[tupel[dimensionEndIndex]].key;
			var text =  metadata.dimensions[dimensionEndIndex].members[tupel[dimensionEndIndex]].text;
			
			var value = data.data[i];

			if(value == undefined || value == "null") {
				continue;
			}
			
			// check the key existence
			if(text.indexOf("|") > -1) {
				text = text.replace("|", " | ");
			}
			
			if(allKeys.indexOf("|" + key + "|") > -1) {
				if(options.iDuplicates=="Ignore") {
					// key already in the array...
					continue;
				}
			}
			
			var itemDef = { 
				key: key, 
				text: text, 
				url: key,
				value: value,
				valueS: org_scn_community_basics.getFormattedValue(value, metadata.locale, options.iNumberOfDecimals),
			};

			if(options.iDuplicates=="Sum") {
				if(allKeys.indexOf("|" + key + "|") > -1) {
					if(value != 0) {
						// search and update value
						for (var iL = 0; iL < list.length; iL++) {
							if(list[iL].key == key){
								list[iL].value = list[iL].value + value;
								list[iL].valueS = org_scn_community_basics.getFormattedValue(list[iL].value, metadata.locale, options.iNumberOfDecimals);
								lValues[iL] = list[iL].value;
								break;
							}
						}
					}
				} else {
					list.push(itemDef);
					lValues.push(value);
				}
			} else {
				list.push(itemDef);
				lValues.push(value);
			}
			
			if(allKeys.indexOf("|" + key + "|") == -1) {
				allKeys = allKeys + key + "|";
			}
		}
	}
	
	if(options.iSortBy!="Default") {
		list.sort(function(a,b) { return parseFloat(b.value) - parseFloat(a.value); } );
	}

	var lAverage = 0;
	for (var i = 0; i < lValues.length; i++) {
		lAverage = lAverage + lValues[i];
	}
	
	if(lValues.length > 0) {
		lAverage = lAverage / lValues.length;
	}
	
	var max = options.iMaxNumber;
	var newList = [];
		
	var counter = 0;
	if(options.iTopBottom == "Top X") {
		for (var i = 0; i < list.length; i++) {
			if(counter >= max) {
				break;
			}
			
			list[i].counter = (i+1);
			list[i].delta = (list[i].value - lAverage);

			if(options.iSortBy!="Default") { // break criteria only for sorted lists
				if(list[i].delta < 0) {
					break;
				}
			}
			
			newList.push(list[i]);
			counter = counter + 1;
		}
	} else if (options.iTopBottom == "Bottom X"){
		var start = list.length-max;
		
		if(list.length < max) {
			start = 0;
		}

		for (var i = start; i < list.length; i++) {
			if(counter >= max) {
				break;
			}
			
			list[i].counter = (i+1);
			list[i].delta = (list[i].value - lAverage);

			if(options.iSortBy!="Default") { // break criteria only for sorted lists
				if(list[i].delta > 0) {
					continue;
				}
			}
			
			newList.push(list[i]);
			counter = counter + 1;
		}
	} else {
		for (var i = 0; i < list.length; i++) {
			if(counter >= max) {
				break;
			}
			
			list[i].counter = (i+1);
			list[i].delta = (list[i].value - lAverage);

			if(options.iSortBy!="Default") { // break criteria only for sorted lists
				if(list[i].delta < 0) {
					break;
				}
			}
			
			newList.push(list[i]);
			counter = counter + 1;
		}
		
		var start = list.length-max;
		if(list.length < max) {
			start = 0;
		}
		
		if(start < counter) {
			start = counter;
		}

		counter = 0;
		
		for (var i = start; i < list.length; i++) {
			if(counter >= max) {
				break;
			}
			
			var element = list[i];
			
			element.counter = (i+1);
			element.delta = (element.value - lAverage);
			
			if(options.iSortBy!="Default") { // break criteria only for sorted lists
				if(element.delta > 0) {
					continue;
				}
			}
			
			newList.push(list[i]);
			counter = counter + 1;
		}
	}

	if(newList.length > 0) {
		var lMaxDelta = Math.abs(newList[0].delta);
		var lMinValue = newList[0].value;
		var lMaxValue = newList[0].value;
	}
	
	for (var i = 0; i < newList.length; i++) {
		var element = newList[i];
		
		if(lMaxDelta < Math.abs(element.delta)) {
			lMaxDelta = Math.abs(element.delta);	
		}
		if(lMinValue > element.value) {
			lMinValue = element.value;	
		}
		if(lMaxValue < element.value) {
			lMaxValue = element.value;	
		}
	}
	
	if(lMaxDelta == 0) {
		lMaxDelta = 1;
	}

	var returnObject = org_scn_community_databound.initializeEmptyReturn();
	returnObject.list = newList;
	returnObject.maxDelta = lMaxDelta;
	returnObject.average = lAverage;
	returnObject.maxValue = lMaxValue;
	returnObject.minValue = lMinValue;

	if(options.allKeys && allKeys.length > 1) {
		returnObject.allKeys = allKeys;
	}
	
	return returnObject;
};

org_scn_community_databound.getDataModelForDimensions = function (data, metadata, dimensions, options) {
	var oData = {};

	if(dimensions != undefined && dimensions != "") {
		var lDimensionsJson = JSON.parse(dimensions);
		for (var iD = 0; iD < lDimensionsJson.length; iD++) {
			var dimension = lDimensionsJson[iD];
			
			if(dimension.isMeasuresDimension != true) {
				var name = dimension.name;
				var text = dimension.text;
				var members = dimension.members;
				
				oData[name] = {};
				oData[name].name = name;
				oData[name].text = text;
				oData[name].items = [];
				
				var dimensionData = org_scn_community_databound.initializeEmptyReturn();
				// ok, we check the existence also when hierarchy is active, even in many cases the members are not visible as collapsed
				dimensionData = org_scn_community_databound.getTopBottomElementsForDimension(data, metadata, name, options);
				
				var availableMembers = "|";
				for (var iM = 0; iM < members.length; iM++) {
					var member = members[iM];
					
					var memberJson = {};
					memberJson.name = member.internalKey;
					memberJson.text = member.text;
					memberJson.externalKey = member.externalKey;
					// memberJson.id = options.idPrefix + name + member.internalKey;
					
					if(dimensionData.allKeys.length > 0) {
						if(dimensionData.allKeys.indexOf("|" + member.internalKey + "|") > -1) {
							// this member is also in result set, means can be selected in drill down mode

							for(var iA = 0; iA < dimensionData.list.length; iA++) {
								if(dimensionData.list[iA].key == memberJson.name){
									if(dimensionData.list[iA].value > 0) {
										memberJson.valueSign = "+";
									} else if(dimensionData.list[iA].value < 0) {
										memberJson.valueSign = "-";
									} else {
										memberJson.valueSign = "0";	
									}
									
									memberJson.value = dimensionData.list[iA].value;
									memberJson.valueS = dimensionData.list[iA].valueS;
								}
							}

							availableMembers = availableMembers + "|" + memberJson.name + "|";
						} else {
							// the member is not in the resultset, cannot be selected in drill down mode
							memberJson.valueSign = "0";
							memberJson.value = 0;
							memberJson.valueS = "0";
						}
					} else {
						// there are no members in the resultset
						memberJson.valueSign = "0";
						memberJson.value = undefined;
						memberJson.valueS = "";
					}
					
					if(options.iDisplayText == "Text (Value)") {
						memberJson.display = memberJson.text + " (" + memberJson.valueS + ")";	
					} else {
						memberJson.display = memberJson.text;
					}

					oData[name].items.push(memberJson);
					oData[name].availableMembers = availableMembers;
				}
			}
		}
	} else {
		oData = {
			brands: {
				name: "BRANDS",
				text: "Brands",
				items: [
				   {text : "BMW", name: "1", enabled: true, value: 30.45, valueS: "30.45", valueSign: "+"},
			 	   {text : "AUDI", name: "2", enabled: true, value: -40.72, valueS: "-40.72", valueSign: "-"}
				]
			}
 			,
 			models: {
				name: "MODELS",
				text: "Models",
				items: [
	 				{text : "320d", name: "1", enabled: true, value: 0.00, valueS: "0.00", valueSign: "0"},
	 				{text : "325i", name: "2", enabled: true, value: -6.43, valueS: "-6.43", valueSign: "-"},
	 				{text : "330d", name: "3", enabled: true, value: 0.00, valueS: "0.00", valueSign: "0"},
	 				{text : "330i", name: "4", enabled: true, value: 1.75, valueS: "1.75", valueSign: "+"},
	 				{text : "335i", name: "5", enabled: true, value: -22.42, valueS: "-22.42", valueSign: "-"},
	 				{text : "A1", name: "6", enabled: true, value: 0.00, valueS: "0.00", valueSign: "0"},
	 				{text : "A3", name: "7", enabled: true, value: 18.32, valueS: "18.32", valueSign: "+"},
	 				{text : "A4", name: "8", enabled: true, value: -7.01, valueS: "-7.01", valueSign: "-"},
	 				{text : "A5", name: "9", enabled: true, value: 2.45, valueS: "2.45", valueSign: "+"},
	 				{text : "A6", name: "10", enabled: true, value: 6.12, valueS: "6.12", valueSign: "+"}
	 			]
			}
 			,
 			types: {
				name: "TYPES",
				text: "Types",
				items: [
					{text : "Limousine", name: "1", enabled: true, value: 0.00, valueS: "0.00", valueSign: "0"},
					{text : "Coupé", name: "2", enabled: true, value: -19.54, valueS: "-19.54", valueSign: "-"},
					{text : "Cabrio", name: "3", enabled: true, value: 2.42, valueS: "2.42", valueSign: "+"}
				]
 			}
 		};
	}

	return oData;
};

/**
 * Flattens data from tuple format to 2D Array
 * @author Mike Howles & Karol Kalisz
 * @param data { 
 *	 	"selection" : [Array of dimension selections] 	
 *	 	"tuples" : *Design Studio Tuples*,
 *		"data" : *Design Studio Data*,
 *   	"formattedData" : *Design Studio Formatted Data*,
 * 		"dimensions" : *Design Studio Metadata Dimensions JSON*,
 *		"locale" : *Design Studio user locale (e.g. en_US)",
 *	  	"axis_columns : [Array of Column Axis Dimension Selection Members]
 *	  	"axis_rows" : [Array of Row Axis Dimension Selection Members]
 *	 }
 * @param options {
 * 		ignoreResults : Boolean (default = true)
 *		ignoreExpandedNodes : Boolean (default = false)
 * 		swapAxes : Boolean (default = false)
 * 		useMockData : Boolean (default = true)
 * }
 * 
 * @return {
 * 		"dimensionHeaders" : [2D Array of dimensions used in rows]
 * 		"dimensionheader" : [1D Array of dimensions used in rows]
 * 		"columnHeaders" : [1D Array of Header Labels]
 * 		"columnHeaders2D" : [2D Array of Header Labels]
 * 		"rowHeaders" : [1D Array of Row Headers]
 *  	"rowHeaders2D" : [2D Array of Row Headers]
 * 		"values" : [2D Array of Measures] 
 *
 * }
 */
org_scn_community_databound.flatten = function (designStudioData, opts) {
	// Important - Copy the JSON object so we do not accidently change original object
	var data = jQuery.parseJSON(JSON.stringify(designStudioData));
	// Initialize with default options
	var options = org_scn_community_databound.initializeOptions();
	// Overwrite defaults with any passed options
	if(opts) {
		for(var option in opts) options[option] = opts[option];
	}
	// Create shell return object
	var retObj = {
		dimensionHeaders : [],		// ["0CALDAY", "0LOCATION", ...]
		dimensionHeader : "",		// "0CALDAY | 0LOCATION"
		dimensionColHeaders : [],	// ["0SALESREP", "0MEASURES", ...]		(TODO)
		dimensionColHeader : "",	// "0SALESREP | 0MEASURES"				(TODO)
		columnHeaders2D : [],		// Two Dimensions in Columns example:
									// [["John Doe", "Sales"],["John Doe", "Discounts"], ...]
									// Simple Example with just Measures Structure: 
									// [["Sales"],["Discounts"], ...]
		columnHeadersKeys2D : [],	// Two Dimensions in Columns example:
									// [["01", "SAL"],["02", "DIS"], ...]
									// Simple Example with just Measures Structure: 
									// [["SAL"],["DIS"], ...]
		columnHeaders : [],			// Two Dimension in Columns Example:
									// ["John Doe | Sales", "John Does | Discounts", ...]
									// Simple Example:
									// ["Sales", "Discounts", ...]
		rowHeaders2D : [],			// [["01/2015", "Memphis"],["01/2015", "Nashville"], ...]]
		rowHeadersKeys2D : [],		// [["01.2015", "MEMPHIS"],["01.2015", "NASHVILLE"], ...]]
		rowHeaders : [],			// ["01/2015 | Memphis", "01/2015 | Nashville", ...]
		values : [],				// [[100, 50], [200, 250], ...]
		formattedValues : [],		// [["100 USD", "50 USD"], ["200 USD", "250 USD"], ...]
		hash : {},					// {"01/2015 | Memphis" : 0, "01/2015 | Nashville" : 1, ... }
		geometry : {}				// {"rowLength" : "18", "colLength" : "2", "headersLength" : "2", "allColumnsLength" : "4" }
	};
	if(!data || !data.dimensions || (!data.data && !data.formattedData)) {
		if(!options.useMockData){
			throw("Incomplete data given.\n\n" + JSON.stringify(data));	
		}else{
			// Use Karol's mock data - Maybe dynamically load this?
			data = {"selection":[-1,-1,-1],"tuples":[[0,0,0],[1,0,0],[0,0,1],[1,0,1],[0,0,2],[1,0,2],[0,0,3],[1,0,3],[0,1,4],[1,1,4],[0,1,3],[1,1,3],[0,2,1],[1,2,1],[0,2,2],[1,2,2],[0,2,4],[1,2,4],[0,2,3],[1,2,3],[0,3,1],[1,3,1],[0,3,2],[1,3,2],[0,3,4],[1,3,4],[0,3,3],[1,3,3],[0,4,1],[1,4,1],[0,4,4],[1,4,4],[0,4,3],[1,4,3],[0,5,3],[1,5,3]],"data":["52.72","1","30.27","1","43.41","1","126.40","3","71.08","1","71.08","1","89.23","2","16.64","1","58.19","1","164.06","4","29.93","1","73.72","1","95.55","2","199.20","4","60.91","2","144.17","3","205.08","5","765.82","17"],"formattedData":["52.72 EUR","1","30.27 EUR","1","43.41 EUR","1","126.40 EUR","3","71.08 EUR","1","71.08 EUR","1","89.23 EUR","2","16.64 EUR","1","58.19 EUR","1","164.06 EUR","4","29.93 EUR","1","73.72 EUR","1","95.55 EUR","2","199.20 EUR","4","60.91 EUR","2","144.17 EUR","3","205.08 EUR","5","765.82 EUR","17"],"dimensions":[{"key":"4FW8C4P934W533L5W4N3J5AON","text":"Key Figures","axis":"COLUMNS","axis_index":0,"containsMeasures":true,"members":[{"key":"4FW8C4WXM3HULQ4M1YPFT79EF","text":"0BC_TURN","scalingFactor":0,"unitOfMeasure":"EUR","formatString":"#,##0.00 EUR;'-'#,##0.00 EUR"},{"key":"4FW8RN37GL043NF22OTQFXYL3","text":"0BC_COUNT","scalingFactor":0,"formatString":"#,##0;'-'#,##0"}]},{"key":"0BC_PERS1","text":"0BC_PERS1","axis":"ROWS","axis_index":0,"members":[{"key":"00002","text":"2"},{"key":"00003","text":"3"},{"key":"00007","text":"7"},{"key":"00008","text":"8"},{"key":"00009","text":"9"},{"key":"SUMME","text":"Overall Result","type":"RESULT"}]},{"key":"0BC_PROD1","text":"0BC_PROD1","axis":"ROWS","axis_index":1,"members":[{"key":"00002","text":"2"},{"key":"00003","text":"3"},{"key":"00008","text":"8"},{"key":"SUMME","text":"Result","type":"RESULT"},{"key":"00012","text":"12"}]}],"locale":"en_US","axis_columns":[[0,-1,-1],[1,-1,-1]],"axis_rows":[[-1,0,0],[-1,0,1],[-1,0,2],[-1,0,3],[-1,1,4],[-1,1,3],[-1,2,1],[-1,2,2],[-1,2,4],[-1,2,3],[-1,3,1],[-1,3,2],[-1,3,4],[-1,3,3],[-1,4,1],[-1,4,4],[-1,4,3],[-1,5,3]],"columnCount":2,"rowCount":18}
		}
	}
	/*
	 * If Swap Axes is set, simply swap row and column-specific properties.
	 */
	if(options.swapAxes){
		var tmp = data.axis_columns;
		data.axis_columns = data.axis_rows;
		data.axis_rows = tmp;
		for(var dI=0;dI<data.dimensions.length;dI++){
			var dim = data.dimensions[dI];
			var axis = dim.axis;
			if(axis=="ROWS") dim.axis="COLUMNS";
			if(axis=="COLUMNS") dim.axis="ROWS";
		}
	}
	retObj.dimensionCols = [];
	retObj.dimensionRows = [];
	retObj.dimensionHeaders = [];
	
	// put on object for external access
	retObj.geometry.colLength = data.axis_columns.length;
	retObj.geometry.rowLength = data.axis_rows.length;

	for(var dI=0;dI<data.dimensions.length;dI++){
		var dim = data.dimensions[dI];

		if(dim.axis == "ROWS") {
			retObj.dimensionRows.push({key: dim.key, text: dim.text});
			retObj.dimensionHeaders.push(dim.text);
		}
		if(dim.axis == "COLUMNS") {
			retObj.dimensionCols.push({key: dim.key, text: dim.text});
		}
	}
	
	var tupleIndex = 0;
	// Make Row Header Labels
	var maxRows = retObj.geometry.rowLength;
	for(var row=0;row<maxRows;row++){
		var newValueRow = [];
		var newFormattedValueRow = [];
		var rowHeader = "";
		var rowHeader2D = [];
		var rowHeaderKey2D = [];
		var rowAxisTuple = data.axis_rows[row];
		var sep = "";
		var isResult = false;
		var isExpanded = false;
		for(var j=0;j<rowAxisTuple.length;j++){
			if(rowAxisTuple[j] != -1){
				if(options.ignoreResults || options.ignoreExpandedNodes) {
					var member = data.dimensions[j].members[rowAxisTuple[j]];
					if(member.type == "RESULT") { isResult=true; break;}
					if(member.nodeState && member.nodeState == "EXPANDED") { isExpanded=true; break;}
					// also hierarchy nodes should be ignored, but this need more work, some code snippet
					// if(member.type == "HIERARCHY_NODE" && member.level == 1 && member.nodeState == "EXPANDED") { isResult=true; break;}
				}

				rowHeader += sep + data.dimensions[j].members[rowAxisTuple[j]].text;
				rowHeader2D.push(data.dimensions[j].members[rowAxisTuple[j]].text);
				rowHeaderKey2D.push(data.dimensions[j].members[rowAxisTuple[j]].key);
				sep = options.dimensionSeparator;
			}
		}
		
		if((isResult && options.ignoreResults) || (isExpanded && options.ignoreExpandedNodes)) { // Added if clause - Mike
			retObj.geometry.rowLength = retObj.geometry.rowLength - 1;
			// move the tupleIndex by the skipped values
			tupleIndex = tupleIndex + retObj.geometry.colLength;
			continue; 
		}else{
			retObj.hash[rowHeader] = row;
			retObj.rowHeaders.push(rowHeader);
			retObj.rowHeaders2D.push(rowHeader2D);
			retObj.rowHeadersKeys2D.push(rowHeaderKey2D);
		}
		
		for(var col=0;col<retObj.geometry.colLength;col++){
			if(data.data && data.data.length > 0){
				newValueRow.push(data.data[tupleIndex]);
			}
			if(data.formattedData && data.formattedData.length > 0){
				newFormattedValueRow.push(data.formattedData[tupleIndex]);
			}
			tupleIndex++;
		}
		if(newValueRow.length>0) retObj.values.push(newValueRow);
		if(newFormattedValueRow.length>0) retObj.formattedValues.push(newFormattedValueRow);
	}
	
	var spliceIndexCorrection = 0;
	
	// Make Column Header Labels and Strip out columns containing totals
	for(var col=0;col<data.axis_columns.length;col++){
		var colHeader = "";
		var colHeader2D = [];
		var colHeaderKey2D = [];
		var colAxisTuple = data.axis_columns[col];
		var sep = "";
		var removeColumn = false;
		for(var j=0;j<colAxisTuple.length;j++){
			if(colAxisTuple[j] != -1){
				if(
					(options.ignoreResults && data.dimensions[j].members[colAxisTuple[j]].type == "RESULT") || 	// Ignore Results case
					(options.ignoreExpandedNodes && data.dimensions[j].members[colAxisTuple[j]].nodeState=="EXPANDED")) // Ignore Expanded node case
					{
					removeColumn = true;
				}
				colHeader += sep + data.dimensions[j].members[colAxisTuple[j]].text;
				colHeader2D.push(data.dimensions[j].members[colAxisTuple[j]].text);
				colHeaderKey2D.push(data.dimensions[j].members[colAxisTuple[j]].key);
				sep = options.dimensionSeparator;			
			}
		}
		if(removeColumn){
			for(var row=0;row<maxRows;row++){
				if(retObj.values[row]) {
					retObj.values[row].splice(col - spliceIndexCorrection,1);
				}
				if(retObj.formattedValues[row]) {
					retObj.formattedValues[row].splice(col - spliceIndexCorrection,1);
				}
			}
			retObj.geometry.colLength = retObj.geometry.colLength - 1;
			
			spliceIndexCorrection++;
		}else{
			retObj.columnHeaders.push(colHeader);
			retObj.columnHeaders2D.push(colHeader2D);
			retObj.columnHeadersKeys2D.push(colHeaderKey2D);
		}		
	}
	
	if(retObj.rowHeaders2D[0]) {
		retObj.geometry.headersLength = retObj.rowHeaders2D[0].length;	
	} else {
		retObj.geometry.headersLength = 0;
	}
	
	retObj.geometry.allColumnsLength = retObj.geometry.headersLength + retObj.geometry.colLength;

	return retObj;
};

org_scn_community_databound.toRowTable = function (flatData, opts) {
	var options = org_scn_community_databound.initializeOptions();
	if(opts) {
		for(var option in opts) options[option] = opts[option];
	}
	
	var rowsData = [];
	var rowsDataPlain = [];
	var headerDataPlain = [];

	if(options.createHaderRow) {
		for(rI=0;rI<flatData.dimensionHeaders.length;rI++){
			headerDataPlain.push(flatData.dimensionHeaders[rI].text);
		}
	
		for(var cI=0;cI<flatData.columnHeaders.length;cI++){
			headerDataPlain.push(flatData.columnHeaders[cI].text);
		}
	}
	
	for(var rI=0;rI<flatData.geometry.rowLength;rI++){
		var rowPlain = {};
		var row = {};
		row["values"] = [];
		for(var cI=0;cI<flatData.geometry.allColumnsLength;cI++){
			if(cI < flatData.geometry.headersLength) {
				row["values"].push(flatData.rowHeaders2D[rI][cI]);
				rowPlain[cI] = flatData.rowHeaders2D[rI][cI];
			} else {
				row["values"].push(flatData.formattedValues[rI][cI-flatData.geometry.headersLength]);
				rowPlain[cI] = flatData.formattedValues[rI][cI-flatData.geometry.headersLength];
			}
		}
		rowsData.push(row);
		rowsDataPlain.push(rowPlain);
	}

	flatData.data2D = rowsData;
	flatData.data2DPlain = rowsDataPlain;
	
	flatData.headerDataPlain = headerDataPlain;
	
	return flatData;
};

org_scn_community_databound.getSampleDataFlat = function (pathInfo, callBack, afterPrepare) {
	var requestForData = new XMLHttpRequest();
    var returnValue = undefined;
    
	requestForData.onreadystatechange = function() {
		// check status and react
		if (requestForData.readyState == 4){
			// sometimes it gets 200 without content
			if(requestForData.status == 404 || requestForData.responseUrl == "" || requestForData.response == "") {
				returnValue= {};
			} else {
				returnValue= requestForData.response;
				callBack(JSON.parse(returnValue), afterPrepare);
			};
		};
	};
	
	// trigger ajax request
	var dataUrl = pathInfo.mainSDKPath + "org.scn.community.databound/res/_data/data.flat.json";
	
	requestForData.open("GET", dataUrl, true);
	requestForData.send();
}

org_scn_community_databound.mixRows = function (master, slave, opts) {
	var options = org_scn_community_databound.initializeOptions();
	if(opts) {
		for(var option in opts) options[option] = opts[option];
	}
	
	var scI = options.slaveColumnIndex;
	if(!scI) {
		scI = 1;
	}
	
	var flatMaster = master.flatData;
	var flatSlave = slave.flatData;
	
	var rowConditionJson = {};
	if(options.conditionRows && options.conditionRows.length > 1) {
		rowConditionJson = JSON.parse(options.conditionRows);
	}
	
	var contentConditionJson = {};
	if(options.conditionContent && options.conditionContent.length > 1) {
		contentConditionJson = JSON.parse(options.conditionContent);
	}
	
	var mcI = flatMaster.geometry.colLength; //flatMaster.geometry.allColumnsLength;
	flatMaster.columnHeaders.push(flatSlave.columnHeaders[0]);
	flatMaster.columnHeaders2D[0].push(flatSlave.columnHeaders2D[0]);
	flatMaster.columnHeadersKeys2D[0].push(flatSlave.columnHeadersKeys2D[0]);

	for(var mrI=0;mrI<flatMaster.rowHeadersKeys2D.length;mrI++){
		var insertRuleRowPassed = true;
		var insertRuleContentPassed = true;

		var rowHeaderKey = flatMaster.rowHeadersKeys2D[mrI][0];

		if(rowConditionJson.operator) {
			var ruleAppliedPositive = false;
			
			for(rI in rowConditionJson.rules) {
				ruleAppliedPositive = org_scn_community_databound.checkRule(rowConditionJson.rules[rI], rowHeaderKey);

				if(!ruleAppliedPositive) {
					insertRuleRowPassed = false;
					break;
				}
			}
		}

		var firstDataInserted = false;
		if(insertRuleRowPassed) {
			for(var srI=0;srI<flatSlave.rowHeadersKeys2D.length;srI++){
				var row1HeaderKey = flatSlave.rowHeadersKeys2D[srI][0];

				if(rowHeaderKey == row1HeaderKey) {
					if(insertRuleContentPassed) {
						firstDataInserted = org_scn_community_databound.appendColumn (mrI, mcI, srI, scI, firstDataInserted, flatMaster, flatSlave, options);
					}
				}
			}
		}
	}
	
	return 0;
};

org_scn_community_databound.mixStructure = function (master, slave, opts) {
	var options = org_scn_community_databound.initializeOptions();
	if(opts) {
		for(var option in opts) options[option] = opts[option];
	}

	var scI = options.slaveColumnIndex;
	if(!scI) {
		scI = 1;
	}
	
	var flatMaster = master.flatData;
	var flatSlave = slave.flatData;

	var columnConditionJson = {};
	if(options.conditionColumns && options.conditionColumns.length > 1) {
		columnConditionJson = JSON.parse(options.conditionColumns);
	}
	
	var rowConditionJson = {};
	if(options.conditionRows && options.conditionRows.length > 1) {
		rowConditionJson = JSON.parse(options.conditionRows);
	}
	
	var contentConditionJson = {};
	if(options.conditionContent && options.conditionContent.length > 1) {
		contentConditionJson = JSON.parse(options.conditionContent);
	}

	for(var mcI=0;mcI<flatMaster.columnHeadersKeys2D.length;mcI++){
		var insertRuleColumnPassed = true;
		var insertRuleRowPassed = true;
		var insertRuleContentPassed = true;
		
		for(var mrI=0;mrI<flatMaster.rowHeadersKeys2D.length;mrI++){
			var rowHeaderKey = flatMaster.rowHeadersKeys2D[mrI];
			var colHeaderKey = flatMaster.columnHeadersKeys2D[mcI];

			if(columnConditionJson.operator) {
				var ruleAppliedPositive = false;
				
				for(rI in columnConditionJson.rules) {
					ruleAppliedPositive = org_scn_community_databound.checkRule(columnConditionJson.rules[rI], colHeaderKey);

					if(!ruleAppliedPositive) {
						insertRuleColumnPassed = false;
						break;
					}
				}
			}
			
			if(rowConditionJson.operator) {
				var ruleAppliedPositive = false;
				
				for(rI in rowConditionJson.rules) {
					ruleAppliedPositive = org_scn_community_databound.checkRule(rowConditionJson.rules[rI], rowHeaderKey);

					if(!ruleAppliedPositive) {
						insertRuleRowPassed = false;
						break;
					}
				}
			}

			var firstDataInserted = false;
			if(insertRuleColumnPassed && insertRuleRowPassed) {
				for(var srI=0;srI<flatSlave.rowHeadersKeys2D.length;srI++){
					var row1HeaderKey = flatSlave.rowHeadersKeys2D[srI][0];
					var row2HeaderKey = flatSlave.rowHeadersKeys2D[srI][1];

					if(rowHeaderKey == row1HeaderKey && colHeaderKey == row2HeaderKey) {
						var dataContent = flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength];
						var dataIndex = mrI * flatMaster.columnHeadersKeys2D.length + mcI;
						var dataValue = flatMaster.values[mrI][mcI];
						
						if(contentConditionJson.operator) {
							var ruleAppliedPositive = false;
							
							for(rI in contentConditionJson.rules) {
								ruleAppliedPositive = org_scn_community_databound.checkRule(contentConditionJson.rules[rI], dataContent, dataValue);

								if(!ruleAppliedPositive) {
									insertRuleContentPassed = false;
									break;
								}
							}
						}
						
						if(insertRuleContentPassed) {
							firstDataInserted = org_scn_community_databound.updateDataContent (mrI, mcI, srI, scI, firstDataInserted, flatMaster, flatSlave, options);
						}
					}
				}
			}

			if(!insertRuleColumnPassed) {
				break;
			}
		}
	}
	
	return 0;
};

org_scn_community_databound.checkRule = function (rule, content, value) {
	var ruleAppliedPositive = false;
	
	if(rule.condition == "contains") {
		for(rM in rule.members) {
			var memberKey = rule.members[rM];

			if(rule.exclude && content.indexOf(memberKey) == -1) {
				ruleAppliedPositive = true;
				break;
			}
			
			if(!rule.exclude && content.indexOf(memberKey) > -1) {
				ruleAppliedPositive = true;
				break;
			}
		}
	}

	if(rule.condition == "equals") {
		for(rM in rule.members) {
			var memberKey = rule.members[rM];

			if(rule.exclude && content != memberKey) {
				ruleAppliedPositive = true;
				break;
			}

			if(!rule.exclude && content == memberKey) {
				ruleAppliedPositive = true;
				break;
			}
		}
	}
	
	if(rule.condition == "empty") {
		if(rule.exclude && content != "") {
			ruleAppliedPositive = true;
		}
		
		if(!rule.exclude && content == "") {
			ruleAppliedPositive = true;
		}
	}
	
	if(rule.condition == "value") {
		var sign = rule.sign;
		var ruleValue = rule.value;
		
		if(value) {
			try {
				var valueFloat = parseFloat(value);
				var ruleValueFloat = parseFloat(ruleValue);
				
				if(!isNaN(valueFloat)) {
					if(sign == ">") {
						if(rule.exclude && !(valueFloat > ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
		
						if(!rule.exclude && (valueFloat > ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
					} else if(sign == "<") {
						if(rule.exclude && !(valueFloat < ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
		
						if(!rule.exclude && (valueFloat < ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
					} else if(sign == "=") {
						if(rule.exclude && !(valueFloat == ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
		
						if(!rule.exclude && (valueFloat == ruleValueFloat)) {
							ruleAppliedPositive = true;
						}
					}
				}
			} catch (e) {
				// ignoring any exceptions...
			}
		}
	}

	return ruleAppliedPositive;
};

org_scn_community_databound.updateDataContent = function (mrI, mcI, srI, scI, firstDataInserted, flatMaster, flatSlave, options) {
	if(!firstDataInserted) {
		// clear the content first
		flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] = "";
	}
	
	var targetData = flatSlave.data2DPlain[srI][scI];
	
	var connectedData = targetData;

	// found row.. 
	if(options.collectMultiple && flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] != "") {
		connectedData = flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] + ", " + targetData;
	} else {
		firstDataInserted = true;
	}

	// no update all data areas of master
	flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] = connectedData;
	flatMaster.data2D[mrI]["values"][mcI+flatMaster.geometry.headersLength] = connectedData;
	if(!flatMaster.values[mrI]) {
		flatMaster.values[mrI] = [];
		flatMaster.formattedValues[mrI] = [];
		mcI = -1;
	}
	flatMaster.values[mrI][mcI] = connectedData; // hmm, how does this work then, TODO: find the corresponding real value
	flatMaster.formattedValues[mrI][mcI] = connectedData;
	
	return firstDataInserted;
}

org_scn_community_databound.appendColumn = function (mrI, mcI, srI, scI, firstDataInserted, flatMaster, flatSlave, options) {
	if(!firstDataInserted) {
		// clear the content first
		flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] = "";
	}
	
	var targetData = flatSlave.data2DPlain[srI][scI];
	
	var connectedData = targetData;

	// found row.. 
	if(options.collectMultiple && flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] != "") {
		connectedData = flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] + ", " + targetData;
	} else {
		firstDataInserted = true;
	}

	// no update all data areas of master
	flatMaster.data2DPlain[mrI][mcI+flatMaster.geometry.headersLength] = connectedData;
	flatMaster.data2D[mrI]["values"][mcI+flatMaster.geometry.headersLength] = connectedData;
	
	// rare case, no values at all
	if(!flatMaster.values[mrI]) {
		flatMaster.values[mrI] = [];
		flatMaster.formattedValues[mrI] = [];
		mcI = 0;
	}
	flatMaster.values[mrI][mcI] = connectedData; // hmm, how does this work then, TODO: find the corresponding real value
	flatMaster.formattedValues[mrI][mcI] = connectedData;
	
	return firstDataInserted;
}

org_scn_community_databound.applyConditionalFormats = function (flatData, opts) {
	var options = org_scn_community_databound.initializeOptions();
	if(opts) {
		for(var option in opts) options[option] = opts[option];
	}
	
	var formattingConditionJson = {};
	if(options.formattingCondition && options.formattingCondition.length > 1) {
		formattingConditionJson = JSON.parse(options.formattingCondition);
	}
	
	if(formattingConditionJson.operator) {
		var ruleSimpleFormat = false;
		
		for(rI in formattingConditionJson.rules) {
			for(var mrI=0;mrI<flatData.data2D.length;mrI++){
				for(var mcI=0;mcI<flatData.data2D[mrI]["values"].length;mcI++){
					var content = flatData.data2D[mrI]["values"][mcI];
					var value = content;
					if(mcI>=flatData.geometry.headersLength) {
						value = flatData.values[mrI][mcI-flatData.geometry.headersLength];	
					}
					ruleSimpleFormat = org_scn_community_databound.checkSimpleFormatingRule(formattingConditionJson.rules[rI], content, value);
					
					if(!flatData.data2D[mrI]["formats"]) {
						flatData.data2D[mrI]["formats"] = [];
					}
					flatData.data2D[mrI]["formats"].push(ruleSimpleFormat);					
				}
			}
		}
	}
	
	return 0;
};

org_scn_community_databound.checkSimpleFormatingRule = function (rule, content, value) {
	var applies = org_scn_community_databound.checkRule (rule, content, value);
	
	if(applies) {
		return rule.simpleFormat;
	}
	
	return "";
};