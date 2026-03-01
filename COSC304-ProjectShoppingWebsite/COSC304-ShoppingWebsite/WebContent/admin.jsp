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

<div class=bodycontainer>

<div class="leftsection">
</div>

 <div class="middlesection">  
  <div class="content" >
   <a href="customereports.jsp"> <h2>Customers</h2></a>
        <p>Manage Customers</p>
  </div> 
   <div class="content gone">
    <a href=""><h2>Lorm Ipsum</h2></a>
        <p>lorem ipsum</p>
  </div>   
  <div class="content">
    <a href="salesreports.jsp"><h2>Sales Reports</h2></a>
        <p>Report on Total Daily Sales</p>
  </div>
  <div class="content">
    <a href="manageproducts.jsp"><h2>Manage Products</h2></a>
        <p>Manager Your Products.</p>
  </div>
  <div class="content">
    <a href="listorder.jsp"><h2>Ship Orders</h2></a>
        <p>Manage Customer Orders</p>
  </div>     

  <div class="content">
    <a href="warehouse.jsp"><h2>Warehouse</h2></a>
        <p>Manage Warehouse & Inventory</p>
  </div>   
 
</div>


<div class="rightsection">
</div>
</div>

</body>
</html>

