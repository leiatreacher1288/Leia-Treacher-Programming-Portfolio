<!DOCTYPE html>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="auth.jsp" %>
<html>
<head>
<%@ include file="header.jsp"%>
<title>Customer Reports</title>
<link rel="stylesheet" type="text/css" href="css/main.css">   

</head>
<body>

<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>
<div class = "goright">
<span > <a href="addcustomer.jsp">Add A Customer</a> </span>
</div>

<h2>Customer Reports</h2>


<table class='order'>
<tr>
<th>User ID</th>
<th>Name</th>
<th>Email</th>
<th>Phone Number</th>
<th>Address</th>
<th>Postal Code</th>
<th>Country</th>

</tr>


<%
// TODO: Write SQL query that prints out customers in a table
String sql = "SELECT [customerId], [userid], [firstName] ,[lastName],[email],[phonenum],[address],[city]" 
      + ",[state],[postalCode],[country] FROM dbo.customer";
      
NumberFormat currFormat = NumberFormat.getCurrencyInstance();
StringBuilder content = new StringBuilder();
ResultSet rs = null;
PreparedStatement pst = null;

try ( Connection con = DriverManager.getConnection(url, uid, pw);){     
    pst = con.prepareStatement(sql);        
    rs = pst.executeQuery();   
   
    while(rs.next()) {    
        content.append("<tr>");
        String custID = rs.getString("customerId");
        content.append("<td>" + rs.getString("userid") + "</td>");  
        String cname = rs.getString("firstName") + " " + rs.getString("lastName");
        content.append("<td>" + cname+ "</td>");             
        content.append("<td>" + rs.getString("email") + "</td>");
        content.append("<td>" + rs.getString("phonenum") + "</td>");
        String address = rs.getString("address") + ", " + rs.getString("city") + ", " 
                             + rs.getString("state");
        content.append("<td>" + address + "</td>");        
        content.append("<td>" + rs.getString("postalCode") + "</td>");
        content.append("<td>" + rs.getString("country") + "</td>");        
        content.append("<td><a href=updatecustomer.jsp?custid="+ custID + ">Update</a></td>");    
        content.append("</tr>");          
		           
    }
    
} catch (SQLException ex) {
    out.println("SQLException: " + ex.getMessage());

}
out.println(content);

%>
</table>


</body> 
</html>