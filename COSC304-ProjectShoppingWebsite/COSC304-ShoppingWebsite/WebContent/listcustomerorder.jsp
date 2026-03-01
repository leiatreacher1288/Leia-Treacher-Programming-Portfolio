<%@ page import="java.sql.*" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ include file="auth.jsp" %>
<!DOCTYPE html>
<html>
<head>
	<%session.setAttribute("form", "listorder.jsp");%>
    <%@ include file="header.jsp" %>
	
<style>
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
</style>
</head>

<body>
	<%
	String customerId = request.getParameter("customerId");
	Integer int_customerId = null;
	int_customerId = Integer.parseInt(customerId.toString());
	%>
	<h1 align="left">Order list for Customer Id:<%=customerId%></h1>
	<form method="post" action='customer.jsp'>
		<input class="submit" type="submit" value="Done">
	</form>
<%
//Note: Forces loading of SQL Server driver
try
{	// Load driver class
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
}
catch (java.lang.ClassNotFoundException e)
{
	out.println("ClassNotFoundException: " +e);
}


// Useful code for formatting currency values:
// out.println(currFormat.format(5.0));  // Prints $5.00
NumberFormat currFormat = NumberFormat.getCurrencyInstance();

// query1: Select all Orders from ordersummary.
String QRY_ALL_ORDERS = "SELECT  orderId, orderDate, c.customerId, firstName, lastName, totalAmount "+
	               "FROM ordersummary os "+
				   "JOIN customer c on os.customerId=c.customerId "+
				   "WHERE c.customerId=?";
// query2: Select all Order Products from an Order with orderId.
String QRY_ALL_ORDERPRODUCTS = "SELECT  p.productId, productName, quantity, price "+
				   "FROM orderproduct op "+
				   "JOIN product p on op.productId=p.productId "+
				   "WHERE op.orderId=?";
// Try with Resources.
// Java will automatically close the resources.
ResultSet rst=null;
try ( Connection con = DriverManager.getConnection(url, uid, pw);
	  PreparedStatement pstmt = con.prepareStatement(QRY_ALL_ORDERS); ){ 
		pstmt.setInt(1, int_customerId);  
		rst = pstmt.executeQuery(); 	
	 
	

	// Iterate through the ResultSet
	while (rst.next()) {
		// create the table and dispay the cell headers
		%>
		<table border="1" width="100%" style="border-collapse: collapse" >
		<tr  bgcolor="Aqua">
		<th>Order Id</th>
		<th>Order Date</th>
		<th>Customer Id</th>
		<th>Customer Name</th>
		<th>Total Amount</th>
		</tr>
		<%
		int orderId = rst.getInt("orderId");  // save the OrderId for next query
		// Display the orderId, orderDate, customerId, firstName, lastName, and totalAmount
		%>
		<tr>
		<td align=center><%=orderId%></td>
		<td align=center><%=rst.getTimestamp("orderDate")%></td>
		<td align=center><%=rst.getInt("customerId")%></td>
		<td align=center><%=rst.getString("firstName")%> <%=rst.getString("lastName")%></td>
		<td align=center><%=currFormat.format(rst.getDouble("totalAmount"))%></td>
		</tr><tr><td colspan =4>
		<%
		// Next, for each order get the productId and productName
		try (PreparedStatement pstmt2 = con.prepareStatement(QRY_ALL_ORDERPRODUCTS);)
		{
			// set the value the query 'orderId'
			pstmt2.setInt(1, orderId);  
			// Execute the query.  Results will be in the ResultSet
			try (ResultSet rst2 = pstmt2.executeQuery();){

				// Nested table to desplay each products ordered in the order4
				%>
				<table border="1"  width="100%" style="border-collapse: collapse">
				<tr bgcolor="Aquamarine"><th>Product ID</th><th align="left">Product Name</th><th>Quantity</th><th>Price</th></tr>
				<%
				while (rst2.next())
				{
					// Display the order product summary
					%>
					<tr><td align="center"><%=rst2.getInt("productId")%></td>
					<td align="left"><%=rst2.getString("productName")%></td>
					<td align="center"><%=rst2.getInt("quantity")%></td>
					<td align="center"><%=currFormat.format(rst2.getDouble("price"))%></td></tr>
					<%
				} %>
				</table></td></tr>
				<%
			} catch (SQLException ex){
				out.println("SQLException: " + ex);
			}  
		} catch (SQLException ex){
			out.println("SQLException: " + ex);
		} %>
		<br><br>
		<%
	} %>
	</table>
	<%
} catch (SQLException ex){
	out.println("SQLException: " + ex);
}  
%>
</body>
</html>
