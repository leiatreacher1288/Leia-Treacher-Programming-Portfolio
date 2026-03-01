<%@ page import="java.sql.*" %>
<%@ page import="java.text.NumberFormat" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.Map" %>
<%@ include file="jdbc.jsp"%>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<!DOCTYPE html>
<html>
<head>
	<title>Warm & Cuddly </title>
	<%@ include file="header.jsp"%>
	<link rel="stylesheet" type="text/css" href="css/main.css"> 
<script>
	document.write('<a href="index.jsp">Main Menu</a>');
</script>
</head>

<p>
</p>
<body>

<% 
// Get customer id
String custId = request.getParameter("customerId");
@SuppressWarnings({"unchecked"})
HashMap<String, ArrayList<Object>> productList = (HashMap<String, ArrayList<Object>>) session.getAttribute("productList");

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

String QRY_INSERT_CUSTOMERID = "INSERT INTO ordersummary(customerId) VALUES (?)";
String QRY_INSERT_ORDER_PRODUCT = "INSERT INTO orderproduct(orderId, productId, quantity, price) "+
									  "VALUES (?,?,?,?)";
String QRY_UPDATE_ORDER_SUMMARY = "UPDATE ordersummary SET orderDate=SYSUTCDATETIME(), totalAmount=? "+
									  "WHERE orderId=?";
String QRY_GET_CUSTOMER = "SELECT customerId, firstName, lastName "+
						  "FROM customer "+
						  "WHERE customerId=?";
										  
// initialize some variables	
int orderId = -1;
double total = 0;
String custFirstName = "";
String custLastName = "";
boolean canContinue = false;
		
// Determine if valid customer id was entered
// Determine if there are products in the shopping cart
// If either are not true, display an error message
// check if customerId exists in database
if (productList == null)
	out.println("<h2>Shopping cart is empty.  Return to the previous screen.</h2>");
else if ( (custId == null) || (custId.equals("")))
	out.println("<h2>Customer Id is blank.  Return to the previous screen.</h2>");
else if (!custId.matches("\\d+"))
	out.println("<h2>Customer Id is invalid.  Return to the previous screen.</h2>");
else {
	try (Connection con = DriverManager.getConnection(url, uid, pw);
		PreparedStatement stmt = con.prepareStatement(QRY_GET_CUSTOMER);){
				 
		stmt.setInt(1, Integer.parseInt(custId));
		try ( ResultSet rst = stmt.executeQuery(); ){
			if (rst.next()) {
				custFirstName = rst.getString("firstName");
				custLastName = rst.getString("lastName");
				canContinue = true;
			}
			else {
				out.println("<h2>Customer Id: " +custId +" does not exist.  Return to the previous screen.</h2>");
			}
		} 
	} catch (SQLException ex){
		throw new SQLException("SQLExcdption: " +ex);
	}
}

if (canContinue) {
	// Use retrieval of auto-generated keys.
	// Create an new ordersummary with customerId
	try ( Connection con = DriverManager.getConnection(url, uid, pw);){

		try ( PreparedStatement pstmt = con.prepareStatement(QRY_INSERT_CUSTOMERID, Statement.RETURN_GENERATED_KEYS);){	

			pstmt.setInt(1, (Integer) Integer.parseInt(custId));
			pstmt.executeUpdate();
			ResultSet keys = pstmt.getGeneratedKeys();
			keys.next();
			orderId = keys.getInt(1);
		} catch (SQLException ex){
			throw new SQLException("SQLExcdption: " +ex);
		}
		// Create a table and display the cell header
		out.println("<table border=\"1\" width=\"60%\" style=\"border-collapse: collapse\">");
		out.println("<tr><td colspan=\"5\"><b>Order Id: </b>"+orderId+"</td></tr>");
		out.println("<tr><td colspan=\"5\"><b>Customer Name: </b>"+custFirstName+" "+custLastName+"</td></tr>");
		
		out.println("<tr>");
		out.println("<th>Product Id</th>");
		out.println("<th>Product Name</th>");
		out.println("<th>Quantity</th>");
		out.println("<th>Price</th>");
		out.println("<th>Sub total</th>");
		out.println("</tr>");

		Iterator<Map.Entry<String, ArrayList<Object>>> iterator = productList.entrySet().iterator();
		while (iterator.hasNext())
		{ 
			Map.Entry<String, ArrayList<Object>> entry = iterator.next();
			ArrayList<Object> product = (ArrayList<Object>) entry.getValue();
			out.println("<tr>");
			String productId = (String) product.get(0);
			String productName = (String) product.get(1);
			String price = (String) product.get(2);
			double pr = Double.parseDouble(price);
			int qty = ( (Integer)product.get(3)).intValue();
			out.println("<td>"+productId+"</td>");
			out.println("<td>"+productName+"</td>");
			out.println("<td align=\"right\">"+qty+"</td>");
			out.println("<td align=\"right\">"+currFormat.format(pr)+"</td>");
			out.println("<td align=\"right\">"+currFormat.format(qty*pr)+"</td>");
			out.println("</tr>");
			try (PreparedStatement pstmt = con.prepareStatement(QRY_INSERT_ORDER_PRODUCT);){
				pstmt.setInt(1, orderId);
				pstmt.setInt(2, (Integer) Integer.parseInt(productId));
				pstmt.setInt(3, qty);
				pstmt.setDouble(4, pr);
				total = total +pr*qty;
				pstmt.executeUpdate();
			} catch (SQLException ex){
				throw new SQLException("SQLExcdption: " +ex);
			}
		}
		
		// Update ordersummary with the total amount
		try (PreparedStatement pstmt = con.prepareStatement(QRY_UPDATE_ORDER_SUMMARY);) {
			pstmt.setDouble(1, total);
			pstmt.setInt(2, orderId);
			pstmt.executeUpdate();
		} catch (SQLException ex){
			throw new SQLException("SQLExcdption: " +ex);
		}
		// Print the total
		out.println("<tr>");
		out.println("<td colspan=\"5\" align=\"right\">Total: "+currFormat.format(total)+"</td>");
		out.println("</tr>");
		
			
		out.println("</table)>");
		//out.println("<h3>Order number: " + orderId+"</h3>");
		//out.println("Customer: "+custFirstName +" "+ custLastName);
		//out.println("<h3>Total amount: " + currFormat.format(total)+"</h3>");

		// Clear cart if order placed successfully
		productList = null;
		session.setAttribute("productList", productList);
		
	} catch (SQLException ex){
		out.println("SQLException: " + ex);
	}
}

%>

</BODY>
</HTML>

