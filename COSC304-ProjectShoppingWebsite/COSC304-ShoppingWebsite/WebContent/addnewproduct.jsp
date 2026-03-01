<!DOCTYPE html>
<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.List" %>
<%@ include file="auth.jsp" %>



<html>
<head>	
	<%@ include file="header.jsp"%>
    <link rel="stylesheet" type="text/css" href="css/main.css">   
</head>

<body>

<% 

String productname = request.getParameter("productname");
String categoryId = request.getParameter("categoryId");
String price = request.getParameter("price");
String quantity = request.getParameter("quantity");
String image = request.getParameter("image");
String description = request.getParameter("description");
String warehouseId = request.getParameter("warehouseId");

if(image == null){
    image = "images/noimage.jpg";
}

boolean isPost = "POST".equalsIgnoreCase(request.getMethod());
int res = 0;

if (isPost) { // Form was submitted  
//out.println("Product Name: " + productname + "<br>");
//out.println("Category: " + categoryId + "<br>");
//out.println("Price: " + price + "<br>");
    String sql = "INSERT INTO dbo.product (productName, productPrice, productImageURL, productDesc, categoryId) " +
                " VALUES (?, ?, ?, ?, ?);"  +
                " SELECT SCOPE_IDENTITY() AS id;";

    PreparedStatement ps = null;
    PreparedStatement ps2 = null;
    ResultSet rs = null;
    
    try ( Connection con = DriverManager.getConnection(url, uid, pw);) {
        ps = con.prepareStatement(sql, ResultSet.CONCUR_UPDATABLE);
        ps.setString(1, productname);
        ps.setString(2, price);
        ps.setString(3, image);
        ps.setString(4, description);
        ps.setString(5, categoryId);             
        rs = ps.executeQuery();

        if (rs.next()) {
            res = rs.getInt("id");
        }      

        String sql2 = "INSERT INTO dbo.productinventory (productId, warehouseId, quantity, price) " +
                " VALUES (?, ?, ?, ?);"; 
        ps2 = con.prepareStatement(sql2, ResultSet.CONCUR_UPDATABLE);
        ps2.setInt(1, res);
        ps2.setString(2, warehouseId);
        ps2.setString(3, quantity);
        ps2.setString(4, price);
        
        res = ps2.executeUpdate();
                
        if(res > 0){
           // out.println("Product Added Successfully.");
        }else{
           // out.println("Error: Product Not Added");
        }

        
    }catch(SQLException e){    
        out.println("Error: " + e.getMessage());
    }  
}

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



<%

%>

<div>
<div class = 'crumb'>
<a href="manageproducts.jsp">Back to Products Page</a>
</div>
<h3>Add A New Product</h3>
<form action="addnewproduct.jsp" method="post">
<table class="order">
<tr>
<td>Product Name:</td>
<td><input type="text" name="productname" required></td>
</tr>
<tr>
<td>Category:</td>
<td><select name="categoryId">
<% for (String category : categories) { %>  
    <% String[] cat = category.split(","); %>   
    <option value="<%=cat[0]%>"><%=cat[1]%></option>
<% } %>
</select></td>
</tr>
<tr>
<td>Price:</td>
<td><input type="text" name="price" required></td>
</tr>
<tr>
<td>Quantity:</td>
<td><input type="text" name="quantity" required></td>
</tr>
<tr>
<td> Warehouse:</td>
<td><select name="warehouseId">
<option value="1">Vancouver Warehouse</option>
<option value="2">Kelowna Warehouse</option>
<option value="3">Edmonton Warehouse</option>
</select></td>
<tr>
<td>Description:</td>
<td><textarea name="description" rows="4" cols="50"></textarea></td>
</tr>
<tr>
<td><input type="submit" value="Add Product"></td>
<td> 
</td>
</tr>
</table>
</form>
</div>

<% if(res > 0 && isPost){ %>  
<div class="confirm" style = align: center>
<p><% out.println(productname); %> added successfully</p>

<% } else if (res != 0 && isPost) { %>
 <p> Not able to add the product.</span><p>
<% } %>
</body>
</html>


