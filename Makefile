TESTDIR = "test"
LIBDIR = "lib"

test: 
  expresso -I lib $(TESTFLAG) $(TESTDIR)/*
  
clean:
  rm -rf $(LIBDIR)-cov
  rm -rf $(TESTDIR)/tmp