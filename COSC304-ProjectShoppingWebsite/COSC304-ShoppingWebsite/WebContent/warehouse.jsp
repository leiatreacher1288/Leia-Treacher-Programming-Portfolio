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

<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>
<h2> Warehouses</h2>

<%  
boolean isPost = "POST".equals(request.getMethod());
String warehouseid = request.getParameter("warehouseid");
String updatesuccess = request.getParameter("updatesuccess");
if (updatesuccess == null) {
    updatesuccess = "0";
}
boolean isGet = "GET".equals(request.getMethod());
%>

<% if(updatesuccess.equals("1")){ %>  
<div class = "confirm"><p> Inventory updated successfully</p>
<% } else if (!updatesuccess.equals("1") && isGet) { %>
 <p>Inventory Update failed</p></div>
<% } %>

<div>
<form class= 'inlineform' method="post" action="warehouse.jsp">
<select name="warehouseid">
<option value="0">Select All Warehouses</option>
<option value="1">Warehouse 1</option>
<option value="2">Warehouse 2</option>
<option value="3">Warehouse 3</option>
</select>
<input type="submit" value="Submit">
</form>	
</div>

<div>
<table class ='order'>
<tr>
<% 

if (warehouseid == null) {
    warehouseid = "0";
}

int res = 0;
//out.println("warehouseid: " + warehouseid);
String sql = "SELECT warehouseId, [warehouseName] FROM [dbo].[warehouse]"; 


if(isPost && "0".equals(warehouseid)) {
    response.sendRedirect("warehouse.jsp");
}

if(isPost && !"0".equals(warehouseid)) {
    sql += " WHERE warehouseId = ?";
}

sql += " ORDER BY warehouseId";

//out.println("sql: " + sql);

String sql2 = " SELECT inv.warehouseId, inv.productId, p.productName, isnull(inv.quantity, 0) as quantity " + 
             " FROM productinventory inv " +
             " left join [dbo].[product] p on p.productId = inv.productId " +
             " where inv.warehouseId = ?   " +
             " order by inv.warehouseId, p.productName,inv.productId, inv.quantity " ;


NumberFormat currFormat = NumberFormat.getCurrencyInstance();
StringBuilder content = new StringBuilder();
ResultSet rs = null;
PreparedStatement pst = null;
ResultSet rs2 = null;
PreparedStatement pst2 = null;

try ( Connection con = DriverManager.getConnection(url, uid, pw);){     
    pst = con.prepareStatement(sql);  
     if(isPost&& !"0".equals(warehouseid)) {
        pst.setString(1, warehouseid);
    }       
    rs = pst.executeQuery();     

    while (rs.next()) {
        String warId = rs.getString(1);
        String  warName =rs.getString(2);
        content.append("<th> Warehouse Name: " + warName + "</th>");
        content.append("</tr>");
        content.append("<tr>");
        content.append("<td><a href=\"updatewarehouse.jsp?warehouseid=").append(warId).append("\">Update Warehouse</a></td>");
        content.append("</tr>");
        content.append("<tr>");               
        content.append("<th>Product Name</th>");
        content.append("<th>Quantity</th>");
        content.append("</tr>");

        pst2 = con.prepareStatement(sql2);
        pst2.setString(1, warId);
        rs2 = pst2.executeQuery();        

        while(rs2.next()) {
            int productId = rs2.getInt(2);
            String productName = rs2.getString(3);
            int quantity = rs2.getInt(4);
            content.append("<tr>");   
            content.append("<td>").append("").append("</td>");        
            content.append("<td>").append(productName).append("</td>");
            content.append("<td>productId: ").append(productId).append("</td>");
           // int isinv_update = 1;            
            content.append("<td>");
            content.append("<form class = 'inlineform' method=\"post\" action=\"updatewarehouseinventory.jsp\">");
            content.append("<input type=\"text\" name=\"quantity\" value=\"").append(quantity).append("\">");            
            content.append("<input type=\"hidden\" name=\"warehouseid\" value=\"").append(warId).append("\">");                      
            content.append("<input type=\"hidden\" name=\"productid\" value=\"").append(productId).append("\">"); 
            content.append("<input type = submit value = \"Update Inventory\">");
            content.append("</form>");
            //<a href=\"\">Update Inventory</a></td>");
            content.append("</tr>");       
        }
        
        
    }   
} catch (SQLException ex) {
    out.println("Error: " + ex.getMessage());
}

out.println(content.toString());
%>
</table>
</div>
</body>
</html>



   
