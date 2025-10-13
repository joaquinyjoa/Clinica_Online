import com.sap.gateway.ip.core.customdev.util.Message;
import groovy.xml.MarkupBuilder
import java.io.StringWriter

def void addAttachment(String name, def data, logLevel, messageLog, type) {
    if (logLevel in ['INFO', 'DEBUG', 'TRACE']) {
        if (messageLog != null) {
            messageLog.addAttachmentAsString(name, data, type);
        }   
    }
}

def Message processData(Message message) {

    def messageLog = messageLogFactory.getMessageLog(message);
    def mpc = message.properties.SAP_MessageProcessingLogConfiguration;
    def logLevel = mpc.logLevel.toString();

    def body = message.getBody(java.lang.String) as String;
    def properties = message.getProperties();
    def headers = message.getHeaders();
    
    //getProperties
    String inBody = properties.get("inBody");
    def ex = properties.get("CamelExceptionCaught");
    def httpsResponseCode = headers.get("CamelHttpResponseCode") ?: 'n/a';

    // Preparar XML de respuesta
    def writer = new StringWriter();
    def xml = new MarkupBuilder(writer);
    String newXML = "";
    
    if (ex != null) {
        // Información general del error SOAP
        def exceptionType = ex.getClass().getCanonicalName();
        def errorMessage = ex.getMessage();  // SOAP Fault detail/message
        String mensajeCompleto = "HTTP Response Code: ${httpsResponseCode}, ExceptionType: ${exceptionType}, SOAP Fault: ${errorMessage}"

        // Log del mensaje
        addAttachment("SOAP.ExceptionType", exceptionType, logLevel, messageLog, "text/plain");
        addAttachment("SOAP.Message", errorMessage, logLevel, messageLog, "text/plain");
        addAttachment("SOAP.MessageCompleto", mensajeCompleto, logLevel, messageLog, "text/plain");
        
        // Armar XML
        xml.'UpsertPMWorkOrderRequest'('xmlns': 'https://www.tecpetrol.com/ServiceMax/UpsertPMWorkOrder/') {
            result {
                errors {
                    extendedErrorDetails {
                        delegate.message(mensajeCompleto) //Coloco "delegate." para que no me tome la variable "message" del script.
                        statusCode(httpsResponseCode)
                    }
                }
            }
        };
        
        newXML = writer.toString();
        
        // Setear XML como nuevo body
        message.setBody(newXML);
        
    } else {
        String responseNoException = "HTTP Error Code: " + httpsResponseCode;
        addAttachment("No se pudo determinar Excepcion", responseNoException, logLevel, messageLog, "text/plain");
    }

    addAttachment("SOAP_Request_inBody.xml", inBody, logLevel, messageLog, "text/xml");
    addAttachment("SOAP_Response.xml", body, logLevel, messageLog, "text/xml");
    

    return message;
}