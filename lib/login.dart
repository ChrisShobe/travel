import 'package:flutter/material.dart';

class LogIn extends StatelessWidget {
  const LogIn({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Log In'),
      ),
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          double width = constraints.maxWidth;
          double height = constraints.maxHeight;

          return Center(
            child: Container(
              width: width,
              height: height,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(color: Color.fromRGBO(35, 48, 63, 1)),
              child: Stack(
                children: [
                  Positioned(
                    left: width * 0.20,
                    top: height * 0.10,
                    child: SizedBox(
                      width: width * 0.60,
                      height: height * 0.08,
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Please enter your Name and Email',
                          style: TextStyle(
                            color: Color(0xFF27AAA0),
                            fontSize: 32,
                            fontWeight: FontWeight.w400,
                            height: 0,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: width * 0.25,
                    top: height * 0.25,
                    child: Container(
                      width: width * 0.50, 
                      height: height * 0.10,
                      decoration: const BoxDecoration(color: Color(0xFFA4F4BC)),
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Name',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: width * 0.25,
                    top: height * 0.45,
                    child: Container(
                      width: width * 0.50, 
                      height: height * 0.10,
                      decoration: const BoxDecoration(color: Color(0xFFA4F4BC)),
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Email',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: width * 0.25,
                    top: height * 0.7,
                    child: Builder(
                      builder: (context) => ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const LogIn()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromRGBO(212, 164, 156, 1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(5),
                          ),
                          minimumSize: Size(width * 0.50, height * 0.10),
                        ),
                        child: const Text(
                          'Enter',
                          style: TextStyle(
                            color: Color.fromRGBO(35, 48, 63, 1),
                            fontSize: 20,
                            fontFamily: 'Sora',
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}