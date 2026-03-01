<!DOCTYPE html>
<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@page import="java.util.ArrayList"%>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ include file="auth.jsp" %>
<html>
<head>	
	<%@ include file="header.jsp"%>
    <link rel="stylesheet" type="text/css" href="css/main.css">   
</head>

<body>
<% 


String productID = request.getParameter("productID");
//out.println("<p> This is the prodid:" + productID + "</p>");
String productName = request.getParameter("productName");
String productDescription = request.getParameter("productDescription");
String productPrice = request.getParameter("productPrice");
String productQuantity = request.getParameter("productQuantity");
String productImage = request.getParameter("productImage");
String newproductImage = request.getParameter("newproductImage");
//String productCategory = request.getParameter("productCategory");
String productCategoryId = request.getParameter("categoryId");

boolean isPost = "POST".equals(request.getMethod());

String sql="";
PreparedStatement ps = null;
ResultSet rs = null;
int res = 0;

 //if it's not a form submission, get the product info from the database
if(isPost) {

    sql = "UPDATE dbo.product SET productName = ?, productDesc = ?, productPrice = ?, " +
                                "productImageURL = ?, categoryId = ? WHERE productId = ?; " +                                
                                "UPDATE dbo.productinventory SET quantity = ? WHERE productId = ?";
    //out.println("<p> product id: " + productID + "</p>");   
    //out.println("<p> product name: " + productName + "</p>");
    
    try ( Connection con = DriverManager.getConnection(url, uid, pw);) {
        ps = con.prepareStatement(sql, ResultSet.CONCUR_UPDATABLE);
        ps.setString(1, productName);
        ps.setString(2, productDescription);
        ps.setString(3, productPrice);        
        ps.setString(4, productImage);
        ps.setString(5, productCategoryId);
        ps.setString(6, productID);
        ps.setString(7, productQuantity);
        ps.setString(8, productID);
        res = ps.executeUpdate();  
        
        
    }catch(SQLException e){
    out.println("Error: " + e.getMessage());    
    }
}

sql = "SELECT p.productId, productName, productPrice, productDesc, p.categoryId," +
                                "productImageURL, ISNULL(pinv.quantity,0) as quantity " +
                                "FROM dbo.product p " +
                                "INNER JOIN dbo.category c on c.categoryId = p.categoryId " +
                                "LEFT JOIN dbo.productinventory pinv on pinv.productId = p.productId " +
                                "WHERE p.productId = ?";
    

try ( Connection con = DriverManager.getConnection(url, uid, pw);) {
        ps = con.prepareStatement(sql);
        ps.setString(1, productID);
        rs = ps.executeQuery();
        while (rs.next()) {
            productID = rs.getString("productId");
            productName = rs.getString("productName");
            productDescription = rs.getString("productDesc");
        //  out.println("<p>" + productDescription + "</p>");
            productPrice = rs.getString("productPrice");
            productQuantity = rs.getString("quantity");
            productImage = rs.getString("productImageURL");
            productCategoryId = rs.getString("categoryId");

        }
}catch(SQLException e){
    out.println("Error: " + e.getMessage());
    //  e.printStackTrace();
}

    
  

//get array of product categories
String sql2 = "SELECT categoryId, categoryName FROM dbo.category order by categoryName asc";
PreparedStatement ps2 = null;
ResultSet rs2 = null;
ArrayList<String> categories = new ArrayList<String>();
try ( Connection con = DriverManager.getConnection(url, uid, pw);) {
    ps2 = con.prepareStatement(sql2);
    rs2 = ps2.executeQuery();
    while (rs2.next()) {
        String catId = rs2.getString("categoryId");
        String catName = rs2.getString("categoryName");
        categories.add(catId + "," + catName);       
        
    } 
    }catch(SQLException e){    
        out.println("Error: " + e.getMessage());
    }   


%>
<div class = 'crumb'>
<a href="manageproducts.jsp">Back to Products Page</a>
</div>
<div>
<h3>Update Product</h3>
<form action="updateprod.jsp" method="post">
<table class="order">
<tr>
<td>Product Name</td>
<td><input type="text" name="productName" value="<%=productName%>">
<input type="hidden" name="productID" value="<%=productID%>"> </td>
</tr>
<tr>
<td>Product Description</td>
<td><input type="text" name="productDescription" value="<%=productDescription%>"></td>  
</tr>
<tr>
<td>Product Price</td>
<td><input type="text" name="productPrice" value="<%=productPrice%>"></td>
</tr>

<tr>
<td>Product Quantity</td>   
<td><input type="text" name="productQuantity" value="<%=productQuantity%>"></td>
</tr>
<tr>
<td>Product Image</td>
<td><img src ="<%=productImage%>"></td>
</tr>
<tr>
<td></td>
<td>Upload New Image: <input type="file" name="newproductImage"></td>
</tr>
<tr>
<td>Product Category</td>
<td><select name="categoryId">
<% for (String category : categories) { %>  
<% String[] cat = category.split(","); %>
<% if (cat[0].equals(productCategoryId)) { %>
<option value="<%=cat[0]%>" selected><%=cat[1]%></option>
<% } else { %>  
<option value="<%=cat[0]%>"><%=cat[1]%></option>
<% } %>
<% } %>
</select></td>
</tr>
<tr>
<td></td>
<td><input type="hidden" name="productImage" value="<%=productImage%>"></td>
<td><input type="submit" value="Update"></td>
</tr>
</table>
</form>
</div>

<% if(res > 0 && isPost){ %>  
<div class = "confirm"><p>Product updated successfully</p>
<% } else if (res != 0 && isPost) { %>
 <p>Product update failed</p></div>
<% } %>

</body>
</html>