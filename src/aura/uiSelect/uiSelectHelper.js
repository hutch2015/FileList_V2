({
    // Function to display the selected item's text in dropdown
    setInfoText: function(component, labels) {
        
        if (labels.length == 0) {
            component.set("v.infoText", "No Options");
        }
        if (labels.length == 1) {
            component.set("v.infoText", labels[0]);
        }
        else if (values.length > 1) {
            component.set("v.infoText", labels.length + " options selected");
        }
    },
    
    getSelectedValues: function(component){
        var options = component.get("v.options_");
        var values = [];
        options.forEach(function(element) {
            if (element.selected) {
                values.push(element.value);
            }
        });
        return values;
    },
    
    getSelectedLabels: function(component){
        var options = component.get("v.options_");
        var labels = [];
        options.forEach(function(element) {
            if (element.selected) {
                labels.push(element.label);
            }
        });
        component.set("v.selectedItems", labels);
        return labels;
    },
    
    despatchSelectChangeEvent: function(component,labels){
        var compEvent = component.getEvent("selectChange");
        var linkedEntityId = component.get("v.linkedEntityId");
        compEvent.setParams({ "labels": labels });
        compEvent.setParams({ "linkedEntityId": linkedEntityId });
        compEvent.fire();
    }
})