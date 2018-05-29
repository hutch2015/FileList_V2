public class SelectItem {

  @AuraEnabled public String  label  {get; set;}
  @AuraEnabled public String  value  {get; set;}
  @AuraEnabled public Boolean  selected  {get; set;}
	
  /**
   * Constructor for setting the values for the user selected item
   */   
  public SelectItem( String value, String label, Boolean selected) {
    this(label,value);
    this.selected = selected;
  }

  /**
   * Constructor for setting the values for the user selected item and to default set to false
   */  
  public SelectItem( String value, String label) {
	this.label = label;
    this.value = value;
    this.selected = false;
  }
}