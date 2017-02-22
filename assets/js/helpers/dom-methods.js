let DomMethods = window.DomMethods || {};
DomMethods.Methods = {};

DomMethods.LoadMethod = function(context){
	if( context === undefined ) {
		context = $(document);
	}

	context.find( '*[data-method]' ).each(function(){
		let that 		= $(this),
		    methods 	= that.attr('data-method');

		$.each(methods.split(" "), function(index, methodName){
			try {
				let MethodClass 	  = DomMethods.Methods[methodName],
				    initializedMethod = new MethodClass(that);
			}
			catch(e) {
				// nothing
			}
		});
	});
};


DomMethods.onReady = function(){
	DomMethods.LoadMethod();
};

export default DomMethods;
