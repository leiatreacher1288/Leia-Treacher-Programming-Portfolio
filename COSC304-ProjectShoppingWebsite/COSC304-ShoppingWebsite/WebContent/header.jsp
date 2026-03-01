<head>
<link rel="stylesheet" type="text/css" href="css/main.css">   
</head>

<style>
 
</style>
<div class="myMenu">
<h5 style="text-align:left;padding:5px;">
    <a href="index.jsp">Home</a>&nbsp;&nbsp;
    <a href="listprod.jsp">Shop Products</a>&nbsp;&nbsp;
    <a href="showcart.jsp">Shopping Cart</a>	
    <span style="float:right;">
	<%
	String form = (String) session.getAttribute("form");
	session.removeAttribute("form");
	
	String userName = (String) session.getAttribute("authenticatedUser");
	if (userName == null) { %>
    <a href="login.jsp?form=<%=form%>">Login</a>
	<%} else {
		out.println("<a href=\"logout.jsp\">Logout</a>&nbsp;&nbsp;");
		out.println("<a href=\"customer.jsp\">"+userName+"</a>&nbsp;&nbsp;");
		out.println("<a href=\"admin.jsp\">Admin Portal</a>");
	}%>
    </span>
</h5>

<title>Warm & Cuddly </title>
<div class="header1"><a href="index.jsp">
	<h1>Warm & Cuddly</h1>
	<h2>Hand-Crafted Products</h2></a>
</div>
</div
<hr>
