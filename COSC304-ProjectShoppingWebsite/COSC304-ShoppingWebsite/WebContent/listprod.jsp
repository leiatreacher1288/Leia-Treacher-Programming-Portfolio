<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<!DOCTYPE html>
<html>
<head>	
		<%session.setAttribute("form", "listprod.jsp");%>
        <%@ include file="header.jsp"%>
<style>
	table {
	  border-collapse: collapse;
	  width: 100%;
	}
	
	th, td {
	  padding: 8px;
	  text-align: left;
	  border-bottom: 1px solid #DDD;
	}
	form{
		font-size: 16px;
	}
	tr:hover {background-color: #D6EEEE;}
</style>
</head>

<body>
	
<h2>Search Product by Category and Name:</h2>
<form method="get" action="listprod.jsp">
	<label for="category">Choose a category:</label>
	<select name="category" id="category" value="All">
	  <option value="All">All</option>
	  <option value="Clothing">Clothing</option>
	  <option value="Accessories">Accessories</option>
	  <option value="Winter Clothing">Winter Clothing</option>
	  <option value="Produce">Produce</option>
	  <option value="Blankets">Blankets</option>
	  <option value="Soft Toys">Soft Toys</option>
	  <option value="Stationary">Stationary</option>
	</select>
	<input type="text" name="productName" size="50">
	<input type="submit" value="Submit"><input type="reset" value="Reset"> (Leave blank for all products)
</form>

<% // Get product name to search for
String name = request.getParameter("productName");
String category = request.getParameter("category");
			
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
String QRY_ALL_PRODUCTS = "SELECT t1.productId, t1.productName, t1.categoryName, t1.productPrice, t1.productImageURL, p.quantity "+
                          "FROM (SELECT productId, productName, categoryName, productPrice, productImageURL "+
			              "FROM product "+
						  "JOIN category on product.categoryId=category.categoryId) as t1 "+
						  "LEFT JOIN productinventory as p on t1.productId=p.productId ";
String QRY_PRODUCTS_LIKE = "SELECT t1.productId, t1.productName, t1.categoryName, t1.productPrice, t1.productImageURL, p.quantity "+
						   "FROM (SELECT productId, productName, categoryName, productPrice, productImageURL "+
						   "FROM product "+
						   "JOIN category on product.categoryId=category.categoryId) as t1 "+
						   "LEFT JOIN productinventory as p on t1.productId=p.productId "+
						   "WHERE productName LIKE ? ";
String QRY_PRODUCTS_CATEGORY = "SELECT t1.productId, t1.productName, t1.categoryName, t1.productPrice, t1.productImageURL, p.quantity "+
						   "FROM (SELECT productId, productName, categoryName, productPrice, productImageURL "+
						   "FROM product "+
						   "JOIN category on product.categoryId=category.categoryId) as t1 "+
						   "LEFT JOIN productinventory as p on t1.productId=p.productId "+
						   "WHERE categoryName=?";
String QRY_PRODUCTS_CATEGORY_LIKE = "SELECT t1.productId, t1.productName, t1.categoryName, t1.productPrice, t1.productImageURL, p.quantity "+
						   "FROM (SELECT productId, productName, categoryName, productPrice, productImageURL "+
						   "FROM product "+
						   "JOIN category on product.categoryId=category.categoryId) as t1 "+
						   "LEFT JOIN productinventory as p on t1.productId=p.productId "+
						   "WHERE categoryName=? AND productName Like ?";
// Try with Resources
// Java will automatically close the Connection con
try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 

	NumberFormat currFormat = NumberFormat.getCurrencyInstance();
	try {
		if (name.equals(""))
			name=null;
	}catch (Exception e){
		name = null;
	}
	try {
		if (category.equals(""))
			category="All";
	}catch (Exception e){ 
		category = "All";
	} 
	
	if ((name == null) && (category.equals("All"))){
		pstmt = con.prepareStatement(QRY_ALL_PRODUCTS);
		%> 
		<h2>All Products</h2>
		<%
	} else if ((name != null) && (category.equals("All")==true) ){
		pstmt = con.prepareStatement(QRY_PRODUCTS_LIKE); 
		pstmt.setString(1, "%"+name+"%");
		%>
		<h2>All Products containing '<%=name%>'</h2>
		<%
	} else if((name != null) && (category.equals("All") == false))  {
		pstmt = con.prepareStatement(QRY_PRODUCTS_CATEGORY_LIKE); 
		pstmt.setString(1, category);
		pstmt.setString(2, "%"+name+"%");
		%>
		<h2>All Products from category '<%=category%>' containing '<%=name%>'</h2>
		<%
	} else {
		pstmt = con.prepareStatement(QRY_PRODUCTS_CATEGORY); 
		pstmt.setString(1, category);
		%>
		<h2>All Products from category '<%=category%>'</h2>
		<%
	}
	// Execute the query.  Results will be in ResultSet
	try (ResultSet rst = pstmt.executeQuery();) {

		// Create the table and display the header or each cell
		%>
		<table  width="100%" style="border-collapse: collapse">
		<tr>
		<th></th>
		<th></th>
		<th align="left">Product Name</th>
		<th align="left">Category</th>
		<th align="left">In Stock</th>
		<th align="left">Price</th>
		</tr>
		<%
		// Iterate through each row in the ResultSet and display the row
		while (rst.next()) {
			int pId = rst.getInt("productId");
			String pName = rst.getString("productName");
			String encodedPName = pName.replaceAll(" ","%20");
			String cName = rst.getString("categoryName");
			double pPrice = rst.getDouble("productPrice");
			String tdColor = getColorOfCategory(cName);
			String prodURL = rst.getString("productImageURL");
			int qty = rst.getInt("quantity");
			%>
			<tr>
				<% if (qty>0){ 
					%>
					<td><a href=addcart.jsp?id=<%=pId%>&name=<%=encodedPName%>&price=<%=pPrice%>&stock=<%=qty%>>Add to Cart</a></td>
					<%}
				else {
					%>
					<td style="color:red">Out of Stock</td>
					<%}
					%>
			<td align="left"><img src ="<%=prodURL%>"></td>
			<td  <% /* eslint-disable css-propertyvalueexpected */ %>align="left" style="color:<%=tdColor%>"><a href=product.jsp?id=<%=pId%> style="<%=tdColor%>"><%=pName%></a></td>			
			<td  <% /* eslint-disable css-propertyvalueexpected */ %>align="left" style="color:<%=tdColor%>"><%=cName%></td>
			<td  <% /* eslint-disable css-propertyvalueexpected */ %>align="left" style="color:<%=tdColor%>"><%=qty%></td>
			<td  <% /* eslint-disable css-propertyvalueexpected */ %>align="left" style="color:<%=tdColor%>"><%=currFormat.format(pPrice)%></td>
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


<%!
public String getColorOfCategory(String cName) { 
	String color="";
	switch(cName) {
		case "Clothing":
			color = "color: Blue";
			break;
		case "Accessories":
			color = "color: Tomato";
			break;
		case "Winter Clothing":
			color = "color: Green";
			break;
		case "Blankets":
			color = "color: MediumOrchid";
			break;
		case "Soft Toys":
			color = "color: OliveDrab";
			break;
		case "Stationary":
			color = "color: Orchid";
			break;
		default:
			color = "color: Black";		
		};
		return color;
}
%>
</html>