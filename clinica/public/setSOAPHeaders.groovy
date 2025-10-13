import com.sap.gateway.ip.core.customdev.util.Message;
import javax.xml.namespace.QName;
import com.sap.gateway.ip.core.customdev.util.SoapHeader;

def Message processData(Message message) {

    def properties = message.getProperties();
    String sessionId = properties.get("sessionId");
    
    String xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><urn:SessionHeader xmlns:urn=\"urn:enterprise.soap.sforce.com\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><urn:sessionId>%sessionId%</urn:sessionId></urn:SessionHeader>";
    xml = xml.replace("%sessionId%", sessionId);
    
    def header = new SoapHeader(new QName("urn:enterprise.soap.sforce.com", "SessionHeader"), xml, false, "");
    
    def headers = new ArrayList();
    headers.add(header);
    
    message.setSoapHeaders(headers);
    
    return message;
}