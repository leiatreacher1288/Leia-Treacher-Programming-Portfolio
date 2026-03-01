<%@ page import="java.sql.*" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<!DOCTYPE html>
<html>
<head>
<%@ include file="header.jsp" %>	
	
</head>

<body>

<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>
<h2 align="center">Order List</h2>

	
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
String QRY_ALL_ORDERS = "SELECT distinct orderId, orderDate, c.customerId, firstName, lastName, totalAmount, s.shipmentDesc "+
	               "FROM ordersummary os "+
				   "JOIN customer c on os.customerId =c.customerId " +
				   "LEFT JOIN dbo.shipment s on os.orderId = s.shipmentDesc";
// query2: Select all Order Products from an Order with orderId.
String QRY_ALL_ORDERPRODUCTS = " SELECT distinct  p.productId, productName, quantity, price "+
				   "FROM orderproduct op "+
				   "JOIN product p on op.productId=p.productId "+
				   "WHERE op.orderId=?";
// Try with Resources.
// Java will automatically close the resources.
try ( Connection con = DriverManager.getConnection(url, uid, pw);
	  PreparedStatement pstmt = con.prepareStatement(QRY_ALL_ORDERS);
	  ResultSet rst = pstmt.executeQuery(); ){ 
	
	

	// Iterate through the ResultSet
	while (rst.next()) {
		// create the table and dispay the cell headers
		out.println("<table border=\"1\" width=\"100%\" style=\"border-collapse: collapse\" >");
		out.println("<tr  bgcolor= #91B2C7>");
		out.println("<th>Order Id</th>");
		out.println("<th>Order Date</th>");
		out.println("<th>Customer Id</th>");
		out.println("<th>Customer Name</th>");
		out.println("<th>Total Amount</th>");
		out.println("</tr>");

		int oId = rst.getInt("orderId");  // save the OrderId for next query
		// Display the orderId, orderDate, customerId, firstName, lastName, and totalAmount
		out.println("<tr>");
		out.println("<td align=\"center\">"+oId+"</td>");
		out.println("<td align=\"center\">"+rst.getTimestamp("orderDate")+"</td>");
		out.println("<td align=\"center\">"+rst.getInt("customerId")+"</td>");
		out.println("<td align=\"center\">"+rst.getString("firstName")+" "+rst.getString("lastName")+"</td>");
		out.println("<td align=\"center\">"+currFormat.format(rst.getDouble("totalAmount"))+"</td>"); 
		String shipmentExists = rst.getString("shipmentDesc");
		// Next row combine 4 columns into 1 
		out.println("</tr><tr><td colspan = 4>"); 
		
		// Next, for each order get the productId and productName
		try (PreparedStatement pstmt2 = con.prepareStatement(QRY_ALL_ORDERPRODUCTS);)
		{
			// set the value the query 'orderId'
			pstmt2.setInt(1, oId);  
			// Execute the query.  Results will be in the ResultSet
			try (ResultSet rst2 = pstmt2.executeQuery();){

				// Nested table to desplay each products ordered in the order4
				out.println("<table border=\"1\"  width=\"100%\" style=\"border-collapse: collapse\">");
				// Display the header of each cell in the table
				out.println("<tr bgcolor=\"Aquamarine\"><th>Product ID</th><th align=\"left\">Product Name</th><th>Quantity</th><th>Price</th></tr>");
				while (rst2.next())
				{
					// Display the order product summary
					out.println("<tr><td align=\"center\">" + rst2.getInt("productId") + "</td>");
						out.println("<td align=\"left\">" + rst2.getString("productName") +"</td>");
						out.println("<td align=\"center\">" + rst2.getInt("quantity") +"</td>");
					out.println("<td align=\"center\">"+currFormat.format(rst2.getDouble("price"))+"</td></tr>");
				}
				out.println("</table></td>");
				if (shipmentExists == null) {
				out.print("<td colspan=\"5\" align=\"center\">");
				out.println("<form class = 'inlineform' action=\"ship.jsp\" method=\"post\">");
				out.println("<input type=\"hidden\" name=\"orderId\" value=\""+oId+"\">");	
				out.println("<input type=\"submit\" value=\"Ship Order\">");
				out.println("</form>");
				out.println("</td></tr>");
				} else {
					out.println("<td colspan=\"5\" align=\"center\">");
					out.println("Order Shipped");
					out.println("</td></tr>");
				}
				
			} catch (SQLException ex){
				out.println("SQLException: " + ex);
			}  
		} catch (SQLException ex){
			out.println("SQLException: " + ex);
		}  	
		out.println("<br><br>");
	}
	out.println("</table>");
} catch (SQLException ex){
	out.println("SQLException: " + ex);
}  

%>

</body>
</html>
