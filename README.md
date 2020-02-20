# Lambda
Simple lambda calculus implementation.
## Usage
Each line is a lambda calculus expression. Lambda is replaced with `>`, dots after arguments are removed. Short hand currying is not allowed.
````
C := λfab. f b a

      |
      V
      
C = >f>a>b f b a
````

Type command `debug` to activate debug mode. It will print expression makeup and step by step reduction.
## Example
- Identity function
````
I = >a a
````
- Kestrel function
````
K = >a>b a
````
- Kite function
````
KI = K I
````
