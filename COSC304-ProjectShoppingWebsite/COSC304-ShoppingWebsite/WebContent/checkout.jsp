<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.text.NumberFormat" %>
<%@ page import="java.util.Map" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%><!DOCTYPE html>
<html>
<head>
<title>checkout view</title>
	<%session.setAttribute("form", "checkout.jsp");%>
	<%@ include file ="header.jsp"%>
<style>
input[type=submit]{
	font-size: 16px;
	padding: 4px 4px;
	margin-left:20px;
	margin-right:20px;
	width: 120px;
}
</style>
</head>
<body>
<h1>One last step.  Please confirm Your Order.</h1>
<%
	int customerId=-1;
	// with the user name we query the database to
	// get the customerId
	String query = "SELECT customerId " +
 			  	   "FROM customer "+
				   "WHERE userid=?";
	PreparedStatement pstmt = null;
	ResultSet rst =null;

	try( Connection con = DriverManager.getConnection(url, uid, pw);){ 
		pstmt = con.prepareStatement(query); 
		pstmt.setString(1, userName);
		    		
	   	rst = pstmt.executeQuery();      		 
		if (rst.next()) {
             customerId= rst.getInt(1);
		}  
			 
	} catch (SQLException ex) {
			out.println("Exception: Failed to get customer Id:" +ex);
	}
	finally
	{
		closeConnection();
	}	
%>
<form method="get" action="order.jsp">
	<input class="submit" type="submit" name="Submit" value="Submit Order">
	<input type="submit" value="Cancel" onclick="form.action='index.jsp';">
	<input type="hidden" name="customerId" value="<%=customerId%>">

</form>

</body>
</html>

