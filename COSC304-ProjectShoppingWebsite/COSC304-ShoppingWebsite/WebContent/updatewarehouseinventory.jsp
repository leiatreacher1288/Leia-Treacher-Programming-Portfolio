<!DOCTYPE html>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="auth.jsp" %>
<html>
<head>
<%@ include file="header.jsp"%>
<title>Customer Reports</title>
<link rel="stylesheet" type="text/css" href="css/main.css">   

</head>


<body>

<% 

String warehouseId = request.getParameter("warehouseid");
String productId = request.getParameter("productid");
String quantity = request.getParameter("quantity");

out.println("warehouseId: " + warehouseId);
out.println("productId: " + productId);
out.println("quantity: " + quantity);

// Form was submitted  

String sql = "SELECT 1 WHERE EXISTS ( SELECT * FROM dbo.productinventory where  productId = ? and warehouseId = ?  ) ";
String sql2 = "";
PreparedStatement ps = null;
PreparedStatement ps2 = null;
ResultSet rs = null;

try ( Connection con = DriverManager.getConnection(url, uid, pw);){  
    ps = con.prepareStatement(sql, ResultSet.CONCUR_UPDATABLE);
    ps.setString(1, productId);
    ps.setString(2, warehouseId);
    rs = ps.executeQuery();    
    
    if (rs.next()) {
        // Product exists in warehouse
        // Update inventory
        out.println("Product exists in warehouse");
        
        sql2 = "UPDATE dbo.productinventory SET quantity = ? WHERE productId = ? and warehouseId = ? ";
        ps2 = con.prepareStatement(sql2, ResultSet.CONCUR_UPDATABLE);
        ps2.setString(1, quantity);
        ps2.setString(2, productId);
        ps2.setString(3, warehouseId);
        ps2.executeUpdate();
    }   
    else {
        // Product does not exist in warehouse
        // Insert new inventory
        sql2 = "INSERT INTO dbo.productinventory (productId, warehouseId, quantity) VALUES (?, ?, ?)";
        ps2 = con.prepareStatement(sql2, ResultSet.CONCUR_UPDATABLE);
        ps2.setString(1, productId);
        ps2.setString(2, warehouseId);
        ps2.setString(3, quantity);
        ps2.executeUpdate();
    }
    response.sendRedirect("warehouse.jsp?updatesuccess=1");
} catch (SQLException e) {
    out.println("SQLException: " + e.getMessage());
    
}



%>