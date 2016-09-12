# To Include in the demo

1. Out of the box templates for http in node and c#
2. Show the functions.json

# CSX

1. Explain how it works
2. Binding to arguments
3. Logging
4. Importing namespaces
5. Which namespaces are already done for you

``` csx
mscorlib,
System
System.Core
System.Xml
System.Net.Http
Microsoft.Azure.WebJobs
Microsoft.Azure.WebJobs.Host
Microsoft.Azure.WebJobs.Extensions
System.Web.Http
System.Net.Http.Formatting.
```

In addition, the following assemblies are special cased and may be referenced by simplename (e.g. #r "AssemblyName"):

``` csx
Newtonsoft.Json
Microsoft.WindowsAzure.Storage
Microsoft.ServiceBus
Microsoft.AspNet.WebHooks.Receivers
Microsoft.AspNEt.WebHooks.Common.
```

6. Package management
7. Environment variables
8. Re-use of csx

## Node

1. Explain the basic function (module.export 1 function)
2. Context object

## Tools and devops

1. Show them kudu
2. Show them deploy via CI
