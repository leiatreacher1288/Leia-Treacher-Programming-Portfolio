<!DOCTYPE html>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="auth.jsp" %>
<html>
<head>
<%@ include file="header.jsp"%>
<title>Administrator Page</title>
<link rel="stylesheet" type="text/css" href="css/main.css">   
</head>

<body>

<div class = 'crumb'>
<a href="warehouse.jsp">Back to Warehouse Portal</a>
</div>

<%
String warehouseName = request.getParameter("warehouseName");
String warehouseID = request.getParameter("warehouseid");
String warehouseAddress = request.getParameter("warehouseAddress");
if (warehouseName == null) {
    warehouseName = "";
}
if (warehouseAddress == null) {
    warehouseAddress = "";
}

boolean isPost = "POST".equalsIgnoreCase(request.getMethod());
int res = 0;

if (isPost) {

    String sql = "UPDATE warehouse SET warehouseName = ? WHERE warehouseID = ?";
    ResultSet rs = null;
    PreparedStatement ps = null;
try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
    ps = con.prepareStatement(sql);
    ps.setString(1, warehouseName);    
    ps.setString(2, warehouseID);
    res = ps.executeUpdate();  
   
}catch (SQLException e) {
    e.printStackTrace();
}
} 

//not post 
String sql = "SELECT warehouseName FROM warehouse WHERE warehouseID = ?";
ResultSet rs = null;
PreparedStatement ps = null;
try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
    ps = con.prepareStatement(sql);
    ps.setString(1, warehouseID);
    rs = ps.executeQuery();
    if (rs.next()) {
        warehouseName = rs.getString("warehouseName");
        //warehouseAddress = rs.getString("warehouseAddress");
    } 
    }catch (SQLException e) {
        e.printStackTrace();
    }
%>

<div>
    <h1>Update Warehouse</h1>
<form action="updateWarehouse.jsp" method="post">
    <input type="hidden" name="warehouseid" value="<%=warehouseID%>">
    <table>
        <tr>
            <td>Warehouse Name</td>
            <td><input type="text" name="warehouseName" value="<%=warehouseName%>"></td>
        </tr>
       <!-- <tr>
            <td>Warehouse Address</td>
            <td><input type="text" name="warehouseAddress" value="<%=warehouseAddress%>"></td>
        </tr> -->
        <tr>
            <td><input type="submit" value="Update"></td>
        </tr>
    </table>
</form>
</div>

<% if (res > 0 && isPost) {  %>
   <div class ="confirm"> <p>Warehouse updated successfully</p> 
<% } else if (res != 0 && isPost) { %>
    <p>Warehouse update failed</p> </div>
<% } %>




</body>
</html>