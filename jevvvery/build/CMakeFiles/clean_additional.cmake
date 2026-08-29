# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "Debug")
  file(REMOVE_RECURSE
  "src/CMakeFiles/jevvvery_autogen.dir/AutogenUsed.txt"
  "src/CMakeFiles/jevvvery_autogen.dir/ParseCache.txt"
  "src/jevvvery_autogen"
  )
endif()
