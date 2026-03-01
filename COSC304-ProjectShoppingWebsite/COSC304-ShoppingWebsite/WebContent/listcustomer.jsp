<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ include file="auth.jsp" %>

<!DOCTYPE html>
<html>
<head>	
    <%session.setAttribute("form", "listcustomer.jsp");%>
    <%@ include file="header.jsp"%>
<style>
    body, div, form, input, select, textarea, label, p { 
      line-height: 22px;
      font-size: 16px;
      }
      
	table {
	  border-collapse: collapse;
	  width: 80%;
	}
    input[type=submit] {
	  margin-left:10px;
	  margin-right:10px
    }
    input[type=submit2] {
		font-size: 16px;
		width: 150px;
		background-color:rgb(9, 195, 108);
		border: none;
		color: rgb(251, 250, 250);
		padding: 4px 4px;
		cursor: pointer;
		margin-right:30px;
} 
</style>
</head>

<body>
	
<h1>Customer list</h2>
 
<% 
// Print prior error login message if present
if (session.getAttribute("validationMessage") != null){
%>
    <h3><%=session.getAttribute("validationMessage").toString()%></h3>
<%}
// Get the list of all warehouses and its products
//Note: Forces loading of SQL Server driver
try
{	// Load driver class
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
}
catch (java.lang.ClassNotFoundException e)
{
	out.println("ClassNotFoundException: " +e);
}


// Initialize some variables
PreparedStatement pstmt = null;

// Create some SQL Queries
String QRY_ALL_CUSTOMER = "SELECT customerId, firstName, lastName, email, userid "+
                          "FROM customer";
// Try with Resources
// Java will automatically close the Connection con
try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 

	//NumberFormat currFormat = NumberFormat.getCurrencyInstance();
	pstmt = con.prepareStatement(QRY_ALL_CUSTOMER);
	
	// Execute the query.  Results will be in ResultSet
	try (ResultSet rst = pstmt.executeQuery();) {

		// Create the table and display the header or each cell
		%>
		<table  width="100%" style="border-collapse: collapse">
		<tr>
            <th align="left">Customer Id</th>
            <th align="left">First Name</th>
            <th align="left">Last Name</th>
            <th align="left">email</th>
            <th align="left">User Id</th>
		</tr>
		<%
		// Iterate through each row in the ResultSet and display the row
		while (rst.next()) {
			int customerId = rst.getInt("customerId");
			String firstName = rst.getString("firstName");
			String lastName = rst.getString("lastName");
			String email = rst.getString("email");
			String userid = rst.getString("userid");
			%>
			<tr>
                <form action="customer.jsp?userid=<%=userid%>"  method="post">
                <td align="left"><%=customerId%></td>			
                <td align="left"><%=firstName%></td>			
                <td align="left"><%=lastName%></td>			
                <td align="left"><%=email%></td>
                <td align="left"><%=userid%></td>
                <td><input type="submit" value="View Customer Detail"></td>	
                </form>		
			</tr>
			<%
		}
		%>
		</table>
        <%
	} catch (SQLException ex){
		out.println("SQLException: " + ex);
	}
} catch (SQLException ex){
			out.println("SQLException: " + ex);
} finally{
	// make sure we close pstmt
	if( pstmt !=null) pstmt.close();
}
%>
</body>
</html>