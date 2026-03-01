<!DOCTYPE html>
<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ include file="header.jsp"%>

<html>
<head>		
    <link rel="stylesheet" type="text/css" href="css/main.css">   
</head>

<body>


<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>

<h2>Product List</h2>


<div class = "goright">
<span > <a href="addnewproduct.jsp">Add New Product</a> </span>
</div>

<div>
<%


// Create some SQL Queries
String QRY_ALL_PRODUCTS = "SELECT p.productId, productName, productPrice, categoryName, SUM(ISNULL(pinv.quantity,0)) as quantity " +
                            "FROM dbo.product p " +
                            "INNER JOIN dbo.category c on c.categoryId = p.categoryId " +
                            "LEFT JOIN dbo.productinventory pinv on pinv.productId = p.productId " +
                            "GROUP BY p.productId, productName, productPrice, categoryName, pinv.quantity " ;

/*String QRY_PRODUCTS_CATEGORY = "SELECT productId, productName, categoryName, productPrice "+
						   "FROM product "+
						   "JOIN category on product.categoryId=category.categoryId "+
						   "WHERE categoryName=?";
*/

NumberFormat currFormat = NumberFormat.getCurrencyInstance();
StringBuilder content = new StringBuilder();
ResultSet rs = null;
PreparedStatement pst = null;
try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
    pst = con.prepareStatement(QRY_ALL_PRODUCTS); 
    rs = pst.executeQuery();    
    // Create the table and display the header or each cell
    content.append("<table class=\"order\">");
    content.append("<tr>");
   // Blank header as placeholder
    content.append("<th >Product Name</th>");
    content.append("<th >Category</th>");
    content.append("<th>Price</th>");
     content.append("<th>Inventory</th>");
    content.append("<th></th>");  
    content.append("<th></th>");
    content.append("</tr>");
    // Iterate through each row in the ResultSet and display the row
    while (rs.next()) {
        int pId = rs.getInt("productId");
        String pName = rs.getString("productName");
        double pPrice = rs.getDouble("productPrice");
        String encodedPName = pName.replaceAll(" ","%20");
        String cName = rs.getString("categoryName");
        int quantity = rs.getInt("quantity");           
        content.append("<tr>");       
        content.append("<td><a href=product.jsp?id="+ pId +">" +pName+ "</a></td>");			
        content.append("<td>"+cName+"</td>");
        content.append("<td>" + currFormat.format(pPrice) + "</td>"); 
        //append with input type text
          
        content.append("<td>" +quantity+ "</td>");
        content.append("<td><a href=updateprod.jsp?productID="+pId+ ">Update</a></td>");        
        content.append("</tr>");
    }

    content.append("</table>");
} catch (SQLException ex){
    content.append("SQLException: " + ex);
}

// Display the content
out.println(content.toString());

%>
</div>
</body>
</html>
```



