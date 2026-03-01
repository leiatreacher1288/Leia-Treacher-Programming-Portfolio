<!DOCTYPE html>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.text.NumberFormat" %>
<%@ include file="auth.jsp" %>
<%@ include file="header.jsp"%>
<%@ page import="java.sql.*" %>
<%@ page import="java.util.ArrayList" %>

<html>
<head>

<title>Sales Reports</title>
<link rel="stylesheet" type="text/css" href="css/main.css">   

<% 
ArrayList<String> orderdaylist = new ArrayList<String>();
ArrayList<Double> totalsaleslist = new ArrayList<Double>();
String sql = "select CONVERT(date, orderDate) as OrderDay, sum(totalAmount) as totalsales " +
             "from ordersummary group by CONVERT(date, orderDate) ";
ResultSet rs = null;
PreparedStatement pst = null;
try ( Connection con = DriverManager.getConnection(url, uid, pw);)
{     
    pst = con.prepareStatement(sql);      
    rs = pst.executeQuery();     
    while(rs.next()) {                     
		String orderday = rs.getString(1);
		double totalsales = rs.getDouble(2);
        orderdaylist.add(orderday);
         totalsaleslist.add(totalsales);            
    }
    
} catch (SQLException ex) {
    out.println("SQLException: " + ex);}
%>


<script src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript">
   google.charts.load("current", {packages:["corechart"]});  
   google.charts.setOnLoadCallback(drawChart);   

    function drawChart() {     
       var data = new google.visualization.DataTable();
       data.addColumn('string', 'OrderDay');
       data.addColumn('number', 'totalsales');
         data.addRows([
            <% for (int i = 0; i < orderdaylist.size(); i++) { %>
            ['<%= orderdaylist.get(i) %>', <%= totalsaleslist.get(i) %>],
            <% } %>     
        ]); 
        
       
      var view = new google.visualization.DataView(data);
     
      var options = {
        title: "Daily Order Sales",
        width: 600,
        height: 400,
        bar: {groupWidth: "95%"},
        legend: { position: "none" },
      };
      var chart = new google.visualization.BarChart(document.getElementById("barchart_values"));
      chart.draw(view, options);
  }
  </script>
</head>
<body>

<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>

<h2>Admin Sales Report by Day</h2>

<table class = 'order'> 
<tr>
<th>Order Date</th>
<th>Total Order Amount</th>
</tr>

<% NumberFormat currFormat = NumberFormat.getCurrencyInstance(); %>
<% for (int i = 0; i < orderdaylist.size(); i++) { %>   
<tr>
<td><%= orderdaylist.get(i) %></td>
<td><%= currFormat.format(totalsaleslist.get(i)) %></td>
</tr>
<% } %>
</table>


<div id="barchart_values" style="width: 900px; height: 300px;"></div>

</body> 

</html>