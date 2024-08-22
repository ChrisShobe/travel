import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'login.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
    home: Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          double width = constraints.maxWidth;
          double height = constraints.maxHeight;

          return Center(
            child: Container(
              width: width, // Use the full available width
              height: height, // Use the full available height
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
                          'Welcome to Your Travel Planner',
                          style: TextStyle(
                            color: Color(0xFF27AAA0),
                            fontSize: 48,
                            fontWeight: FontWeight.w400,
                            height: 0,
                          ),
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
                          minimumSize: Size(width * 0.50, height * 0.10), // Adjust the size of the button
                        ),
                        child: const Text(
                          'Start',
                          style: TextStyle(
                            color: Color.fromRGBO(35, 48, 63, 1),
                            fontSize: 20, // Increase the font size
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
    )
    );
  }
}