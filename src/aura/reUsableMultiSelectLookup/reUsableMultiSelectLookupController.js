({
    onblur : function(component,event,helper){
        // on mouse leave clear the listOfSeachRecords & hide the search result component 
        component.set("v.listOfSearchRecords", null );
        component.set("v.SearchKeyWord", '');
        var forclose = component.find("searchResult");
        $A.util.addClass(forclose, 'slds-is-close');
        $A.util.removeClass(forclose, 'slds-is-open');
    },
    onfocus : function(component,event,helper){
        // show the spinner,show child search result component and call helper function
        $A.util.addClass(component.find("mySpinner"), "slds-show");
        component.set("v.listOfSearchRecords", null ); 
        var forOpen = component.find("searchResult");
        $A.util.addClass(forOpen, 'slds-is-open');
        $A.util.removeClass(forOpen, 'slds-is-close');
        // Get Default 5 Records order by createdDate DESC 
        var getInputkeyWord = '';
        helper.searchHelper(component,event,getInputkeyWord);
    },
    
    keyPressController : function(component, event, helper) {
        $A.util.addClass(component.find("mySpinner"), "slds-show");
        // get the search Input keyword   
        var getInputkeyWord = component.get("v.SearchKeyWord");
        // check if getInputKeyWord size id is greater than 0 then open the lookup result List and 
        // call the helper 
        // else close the lookup result List part.   
        if(getInputkeyWord.length > 0){
            var forOpen = component.find("searchResult");
            $A.util.addClass(forOpen, 'slds-is-open');
            $A.util.removeClass(forOpen, 'slds-is-close');
            helper.searchHelper(component,event,getInputkeyWord);
        }
        else{  
            component.set("v.listOfSearchRecords", null ); 
            var forclose = component.find("searchResult");
            $A.util.addClass(forclose, 'slds-is-open');
            $A.util.removeClass(forclose, 'slds-is-close');
            var getInputkeyWord = '';
            helper.searchHelper(component,event,getInputkeyWord);
        }
    },
    
    // Function to clear the record selection 
    clear :function(component,event,heplper){
        var selectedPillId = event.getSource().get("v.name");
        var AllPillsList = component.get("v.listSelectedRecords"); 
        
        for(var i = 0; i < AllPillsList.length; i++){
            if(AllPillsList[i].Id == selectedPillId){
                AllPillsList.splice(i, 1);
                component.set("v.listSelectedRecords", AllPillsList);
                component.set("v.listSelectedRecordsLength", AllPillsList.length);
            }  
        }
        component.set("v.SearchKeyWord",null);
        component.set("v.listOfSearchRecords", null ); 
    },
    
    // This function will be called when the end User Select any record from the result list.   
    handleComponentEvent : function(component, event, helper) {
        component.set("v.SearchKeyWord",null);
        // get the selected object record from the COMPONENT event 	 
        var listSelectedItems =  component.get("v.listSelectedRecords");
        var selectedAccountGetFromEvent = event.getParam("recordByEvent");
        listSelectedItems.push(selectedAccountGetFromEvent);
        component.set("v.listSelectedRecords" , listSelectedItems); 
        component.set("v.listSelectedRecordsLength", listSelectedItems.length);
        
        var forclose = component.find("lookup-pill");
        $A.util.addClass(forclose, 'slds-show');
        $A.util.removeClass(forclose, 'slds-hide');
        
        var forclose = component.find("searchResult");
        $A.util.addClass(forclose, 'slds-is-close');
        $A.util.removeClass(forclose, 'slds-is-open'); 
    },
    handleSelectChangeEvent: function(component, event, helper) {
        var items = component.get("v.options");
        items = event.getParam("values");
        component.set("v.options", items);
    }
})