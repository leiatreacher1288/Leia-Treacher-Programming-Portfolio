<%@ page import="java.util.HashMap" %>
<%@ page import="java.text.NumberFormat" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<%@ include file="jdbc.jsp" %>

<html>

<head>	
	<%session.setAttribute("form", "product.jsp");%>
    <%@ include file="header.jsp"%>
<link href="css/bootstrap.min.css" rel="stylesheet">
<style>
.prodinfo {
    font-weight:bold;
}
.outofstock {
    font-weight:bold;
    color:red;
}
.nav a{
    color: Tomato;
    font-weight:bold;
}
</style>
</head>
<body>



<%

 String productId = request.getParameter("id");
 int pId = Integer.parseInt(productId);
 
 String QRY_PRODUCT = "SELECT t1.productId, t1.productName, t1.categoryName, t1.productPrice, t1.productImageURL, t1.productImage, t1.productDesc, p.quantity "+
                                "FROM (SELECT productId, productName, categoryName, productPrice, productImageURL, productImage, productDesc "+
                                "FROM product "+
                                "JOIN category on product.categoryId=category.categoryId) as t1 "+
                                "LEFT JOIN productinventory as p on t1.productId=p.productId "+
                                "WHERE t1.productId=?";
PreparedStatement pst = null;
NumberFormat currFormat = NumberFormat.getCurrencyInstance();
StringBuilder content = new StringBuilder();
ResultSet rs = null;

try ( Connection con = DriverManager.getConnection(url, uid, pw);)
{ 
   
    pst = con.prepareStatement(QRY_PRODUCT);    
    pst.setInt(1, pId);  
    rs = pst.executeQuery();   
    if(rs.next()) {    
        //int pId = rs.getInt("productId");
		String pName = rs.getString("productName");
		String encodedPName = pName.replaceAll(" ","%20");
		String cName = rs.getString("categoryName");
		String pDesc = rs.getString("productDesc");
		double price = rs.getDouble("productPrice");
		String pUrl = rs.getString("productImageURL");
		int qty = rs.getInt("quantity");         
		
        content.append("<h1>" + pName + "</h1>");       
        content.append("<p><img src =" + pUrl + "></p>");
        if (rs.getString("productImage") != null) { content.append("<p><img src =displayImage.jsp?id=" + productId + "></p>"); }    
        content.append("<p class =\"prodinfo\"> Product Id: " + productId +"</p>");
        content.append("<p class =\"prodinfo\"> Category: " + cName +"</p>");
        content.append("<p class =\"prodinfo\"> Description: " + pDesc +"</p>");
        content.append("<p class =\"prodinfo\"> Price "+ currFormat.format(price) + "</p>");
        if ( qty > 0){ content.append("<p class = \"nav\"><a href=addcart.jsp?id=" + pId + "&name=" + encodedPName + "&price=" + price+ "&stock=" +qty+ ">Add to Cart</a></p>");}
        else{ content.append("<p class =\"outofstock\">Out of Stock</p>");}
    }
    content.append("<p class = \"nav\"><a href=listprod.jsp>Continue Shopping</a></p>");   	

} catch (SQLException ex) {
    out.println("SQLException: " + ex);
}
	
out.println(content);


%>

</body>
</html>

