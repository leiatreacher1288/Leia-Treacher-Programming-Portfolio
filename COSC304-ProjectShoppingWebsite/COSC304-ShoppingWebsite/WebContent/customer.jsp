<!DOCTYPE html>
<html>
<head>
	<%session.setAttribute("form", "customer.jsp");%>
    <%@ include file ="header.jsp"%>
<title>Customer Page</title>
<style>
table, td  {
  border: 1px solid black;
  border-collapse: collapse;  
  width:75%;
}
th {
	border: 1px solid black;
	border-collapse: collapse; 
	width: 25%;
}
 input[type=submit] {
	font-size: 16px;
	width: 150px;
	background-color:rgb(9, 195, 108);
	border: none;
	color: rgb(251, 250, 250);
	padding: 4px 4px;
    cursor: pointer;
	margin-left:30px;
	margin-right:30px;
}  
form{
	text-align: center;
}
</style>
</head>
<body>

<%@ include file="auth.jsp"%>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>

<%
	//String userName = (String) session.getAttribute("authenticatedUser");
%>

<%

// TODO: Print Customer information
String userid = request.getParameter("userid");

StringBuilder content = new StringBuilder();
String sql = "SELECT customerId, firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid " +
 			  "FROM [orders].[dbo].[customer] where userid = ?";
PreparedStatement pst = null;
ResultSet rs =null;
Integer customerId=-1;
content.append("<h1>Customer Profile</h1>"
             + "<table>" );         
             

try ( Connection con = DriverManager.getConnection(url, uid, pw) )
		{
			pst = con.prepareStatement(sql);  
			if ((userid != null) && (userid.equals("null")==false))
				pst.setString(1, userid);   		
    		else	
   				pst.setString(1, userName);   		
    		rs = pst.executeQuery();      		 
		   if(rs.next()) {
			customerId=rs.getInt(1);
			content.append("<tr><th>Id</th><td>" + rs.getInt(1) + "</td></tr>" +
							"<tr><th>First Name</th><td>" + rs.getString(2) + "</td></tr>" +
							"<tr><th>Last Name</th><td>" + rs.getString(3) + "</td></tr>" +
							"<tr><th>Email</th><td>" + rs.getString(4) + "</td></tr>" +
							"<tr><th>Phone</th><td>" + rs.getString(5) + "</td></tr>" + 
							"<tr><th>Address</th><td>" + rs.getString(6) + "</td></tr>" +
							"<tr><th>City</th><td>" + rs.getString(7) + "</td></tr>" +
							"<tr><th>State</th><td>" + rs.getString(8) + "</td></tr>" +
							"<tr><th>Postal Code</th><td>" + rs.getString(9) + "</td></tr>" +
							"<tr><th>Country</th><td>" + rs.getString(10) + "</td></tr>" +
							"<tr><th>User id</th><td>" + rs.getString(11) + "</td></tr>");
		   }  
			 
		} 
		catch (SQLException ex) {
			out.println(ex);
		}
		finally
		{
			closeConnection();
		}	

content.append ("</table>");
out.println(content);

// Make sure to close connection
if ((userid != null) && (userid.equals("null")==false)){
	out.println("<form name=\"MyForm\" method=post action=\"addcustomer.jsp?customerId="+customerId+"&userid="+ userid +"\">");
		%>
			<br>
			<input class="submit" type="submit"  value="Done" onclick="form.action='listcustomer.jsp';">
<!--<input class="submit" type="submit" name="Submit2" value="Edit User">-->
		<%
} else{
			
	out.println("<form name=\"MyForm\" method=post action=\"addcustomer.jsp?customerId="+customerId+"&userid="+ userName +"\">");
	%>
		<br>
		<input class="submit" type="submit" name="CustomerOrder" value="View Orders" onclick="form.action='listcustomerorder.jsp?customerId=<%=customerId%>';">
		<input class="submit" type="submit" name="Submit2" value="Edit User">
		<input class="submit" type="submit" value="Logout" onclick="form.action='logout.jsp';">
<%}%>	
</form>

</body>
</html>

