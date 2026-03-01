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
<h2>Customer Report</h2>

<p><a href="customereports.jsp">Back to Customer Page</a></p>
</div>
<div>
<h3>Update Customer</h3>

<%

String custid = request.getParameter("custid");
String firstname = request.getParameter("custname");
String lastname = request.getParameter("lastname");
String email = request.getParameter("email");
String address = request.getParameter("address");
String city = request.getParameter("city");
String postalcode = request.getParameter("postalcode");
String state = request.getParameter("state");
String phone = request.getParameter("phone");
String country = request.getParameter("country");
boolean isPost = "POST".equals(request.getMethod());


String sql="";
PreparedStatement pst = null;
ResultSet rs = null;
int res = 0;

if(isPost) {
    try ( Connection con = DriverManager.getConnection(url, uid, pw);){     
        sql = "UPDATE dbo.customer SET firstName = ?, lastName= ?, email = ?, address = ?, city =?, state= ?, postalCode = ?, phonenum = ?, country = ? WHERE customerId = ?";
        pst = con.prepareStatement(sql);
        pst.setString(1, firstname);
        pst.setString(2, lastname);
        pst.setString(3, email);
        pst.setString(4, address);
        pst.setString(5, city);
        pst.setString(6, state);
        pst.setString(7, postalcode);
        pst.setString(8, phone);
        pst.setString(9, country);
        pst.setString(10, custid);        

        
        res = pst.executeUpdate();     
        
    } catch (SQLException ex) {
        out.println(ex.getMessage());
    }
}


sql = "SELECT [customerId], [userid], [firstName] ,[lastName],[email],[phonenum],[address],[city]" 
      + ",[state],[postalCode],[country] FROM dbo.customer"
        + " WHERE customerId = ?";



try ( Connection con = DriverManager.getConnection(url, uid, pw);){     
    pst = con.prepareStatement(sql); 
    pst.setString(1, custid);       
    rs = pst.executeQuery();   
    if (rs.next()) {
         firstname = rs.getString("firstName");
         lastname = rs.getString("lastName");
         email = rs.getString("email");
         address = rs.getString("address");
         city = rs.getString("city");
         state = rs.getString("state");
         postalcode = rs.getString("postalCode");
         phone = rs.getString("phonenum");
         country = rs.getString("country");
    }
} catch (SQLException ex) {
     out.println("Error: " + ex.getMessage());
}

%>


<form action="updatecustomer.jsp" method="post">
<table>
<tr>
<td>First Name</td>
<td><input type="text" name="custname" value="<%=firstname%>"></td>
<input type="hidden" name="custid" value="<%=custid%>">
</tr>
<tr>
<td>Last Name</td>
<td><input type="text" name="lastname" value="<%=lastname%>"></td>
</tr>
<td> Email</td>
<td><input type="text" name="email" value="<%=email%>"></td>
</tr>
<tr>
<td>Address</td>
<td><input type="text" name="address" value="<%=address%>"></td>
</tr>
<tr>
<td>City</td>
<td><input type="text" name="city" value="<%=city%>"></td>
</tr>
<tr>
<td>State</td>
<td><input type="text" name="state" value="<%=state%>"></td>
</tr>
<tr>
<td>Postal Code</td>    
<td><input type="text" name="postalcode" value="<%=postalcode%>"></td>
</tr>
<tr>
<td>Phone</td>
<td><input type="text" name="phone" value="<%=phone%>"></td>
</tr>
<tr>
<td>Country</td>
<td><input type="text" name="country" value="<%=country%>"></td>
</tr>
<tr>
<td></td>
<td><input type="submit" value="Update"></td>
</tr>
</table>
</form>




<% if(res > 0 && isPost){ %>  
<div class= "confirm"><p>Customer updated successfully</p>
<% } else if (res != 0 && isPost) { %>
 <p>Customer update failed. Try again.</p></div>
<% } %>