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
<a href="manageproducts.jsp">Back to Products</a>
</div>
<%

String productID = request.getParameter("productID");

String sql = "DELETE FROM dbo.product WHERE productId = ?";
PreparedStatement ps = null;
try (Connection con = DriverManager.getConnection(url, uid, pw);){ 
    int res = 0;
    ps = con.prepareStatement(sql, ResultSet.CONCUR_UPDATABLE);
    ps.setString(1, productID);
    res = ps.executeUpdate();
    if (res > 0) {
        out.println("<p>Product deleted successfully.</p>");
    } else {
        out.println("<p>Product not found.</p>");
    }
    
} catch (SQLException e) {
out.println("<p>An error occurred while deleting product: " + e.getMessage() + "</p>");
}



%>