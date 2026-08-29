# CMake generated Testfile for 
# Source directory: /home/luke/Projects/Web Deb/src/brick_tower_game/jevvvery
# Build directory: /home/luke/Projects/Web Deb/src/brick_tower_game/jevvvery/build
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(appstreamtest "/usr/bin/cmake" "-DAPPSTREAMCLI=/usr/bin/appstreamcli" "-DINSTALL_FILES=/home/luke/Projects/Web Deb/src/brick_tower_game/jevvvery/build/install_manifest.txt" "-P" "/usr/share/ECM/kde-modules/appstreamtest.cmake")
set_tests_properties(appstreamtest PROPERTIES  _BACKTRACE_TRIPLES "/usr/share/ECM/kde-modules/KDECMakeSettings.cmake;173;add_test;/usr/share/ECM/kde-modules/KDECMakeSettings.cmake;191;appstreamtest;/usr/share/ECM/kde-modules/KDECMakeSettings.cmake;0;;/home/luke/Projects/Web Deb/src/brick_tower_game/jevvvery/CMakeLists.txt;11;include;/home/luke/Projects/Web Deb/src/brick_tower_game/jevvvery/CMakeLists.txt;0;")
subdirs("src")
